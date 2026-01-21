const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const sharp = require('sharp'); // Optional: for image optimization

// Cache for successful image responses
const imageCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Middleware to add CORS headers
function addCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

// Handle preflight requests
router.options('/proxy/mangadex-image', (req, res) => {
  addCorsHeaders(res);
  res.sendStatus(200);
});

router.options('/proxy/placeholder', (req, res) => {
  addCorsHeaders(res);
  res.sendStatus(200);
});

// Main MangaDex image proxy endpoint
router.get('/proxy/mangadex-image', async (req, res) => {
  try {
    addCorsHeaders(res);
    
    const imageUrl = req.query.url;
    const mangaId = req.query.mangaId;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'No image URL provided' });
    }
    
    console.log(`🖼️ Proxying MangaDex image: ${imageUrl.substring(0, 100)}...`);
    
    // Check cache first
    const cacheKey = imageUrl;
    const cached = imageCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log(`✅ Serving from cache: ${mangaId || 'unknown'}`);
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
      res.setHeader('X-Cache', 'HIT');
      return res.send(cached.data);
    }
    
    // Fetch image from MangaDex with required headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'MangaReader/1.0 (+https://github.com/your-repo)',
        'Referer': 'https://mangadex.org/',
        'Accept': 'image/*'
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch image: ${response.status} ${response.statusText}`);
      throw new Error(`Image fetch failed: ${response.status}`);
    }
    
    // Get image data
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Validate it's actually an image
    if (!contentType.startsWith('image/')) {
      console.error(`❌ Not an image: ${contentType}`);
      throw new Error('Response is not an image');
    }
    
    // Optional: Optimize image (resize, compress)
    let finalBuffer = buffer;
    let finalContentType = contentType;
    
    try {
      // Resize to max 512px width for faster loading
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      if (metadata.width > 512) {
        finalBuffer = await image
          .resize(512, null, { withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        finalContentType = 'image/jpeg';
        console.log(`📐 Resized: ${metadata.width}x${metadata.height} -> 512px wide`);
      }
    } catch (optimizeError) {
      console.log(`⚠️ Could not optimize image, using original: ${optimizeError.message}`);
      // Use original buffer if optimization fails
    }
    
    // Cache the image
    imageCache.set(cacheKey, {
      data: finalBuffer,
      contentType: finalContentType,
      timestamp: Date.now()
    });
    
    // Clean old cache entries (optional)
    if (imageCache.size > 100) {
      const oldestKey = Array.from(imageCache.keys())[0];
      imageCache.delete(oldestKey);
    }
    
    // Set response headers
    res.setHeader('Content-Type', finalContentType);
    res.setHeader('Content-Length', finalBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Original-Source', 'mangadex.org');
    
    // Send the image
    res.send(finalBuffer);
    
    console.log(`✅ Successfully proxied image for manga: ${mangaId || 'unknown'} (${Math.round(finalBuffer.length / 1024)}KB)`);
    
  } catch (error) {
    console.error('❌ Image proxy error:', error.message);
    
    addCorsHeaders(res);
    
    // Return a placeholder image
    try {
      const width = parseInt(req.query.width) || 256;
      const height = parseInt(req.query.height) || 384;
      const text = req.query.text || 'Cover Not Available';
      const bgColor = req.query.bg || '2a2a2a';
      const textColor = req.query.color || 'ffffff';
      
      const placeholderUrl = `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
      
      const placeholderResponse = await fetch(placeholderUrl);
      const placeholderBuffer = await placeholderResponse.buffer();
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      res.send(placeholderBuffer);
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Failed to proxy image',
        message: error.message,
        url: req.query.url
      });
    }
  }
});

// Placeholder image endpoint
router.get('/proxy/placeholder', async (req, res) => {
  try {
    addCorsHeaders(res);
    
    const width = parseInt(req.query.width) || 256;
    const height = parseInt(req.query.height) || 384;
    const text = req.query.text || 'No Cover';
    const bgColor = req.query.bg || '3a3a3a';
    const textColor = req.query.color || 'ffffff';
    const fontSize = req.query.size || '16';
    
    // Create SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#${bgColor}"/>
        <text 
          x="50%" 
          y="50%" 
          font-family="Arial, sans-serif" 
          font-size="${fontSize}" 
          fill="#${textColor}" 
          text-anchor="middle" 
          dy=".3em"
        >
          ${text}
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.send(svg);
    
  } catch (error) {
    console.error('Placeholder error:', error);
    res.status(500).json({ error: 'Failed to generate placeholder' });
  }
});

// Health check for proxy
router.get('/proxy/health', (req, res) => {
  addCorsHeaders(res);
  res.json({
    status: 'ok',
    cacheSize: imageCache.size,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;