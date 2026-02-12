// util/apiClient.js
const { rateLimiters, circuitBreakers, internetArchiveFallback } = require('./rateLimiter');

// Your existing fetchJson - import or define
const originalFetchJson = require('./fetchJson'); // Adjust path as needed

// Enhanced fetch with rate limiting and circuit breaker
async function fetchWithRateLimit(apiName, url, options = {}) {
  // Special handling for Internet Archive
  if (apiName === 'internetArchive') {
    return fetchInternetArchive(url, true);
  }
  
  const rateLimiter = rateLimiters[apiName];
  const circuitBreaker = circuitBreakers[apiName];
  
  if (!rateLimiter) {
    try {
      return await originalFetchJson(url, options);
    } catch (error) {
      console.error(`❌ ${apiName} API error:`, error.message);
      throw error;
    }
  }

  const execute = async () => {
    return await rateLimiter.schedule(async () => {
      try {
        const result = await originalFetchJson(url, options);
        return result;
      } catch (error) {
        console.error(`❌ ${apiName} API error:`, error.message);
        throw error;
      }
    });
  };

  if (circuitBreaker) {
    return circuitBreaker.execute(execute);
  }

  return execute();
}

// FIXED: Internet Archive handler with proper URL transformation and error handling
async function fetchInternetArchive(url, useScrape = true) {
  // Transform advancedsearch.php URLs to scrape API
  let transformedUrl = url;
  
  if (url.includes('advancedsearch.php') && useScrape) {
    // Extract query parameters
    const urlObj = new URL(url);
    const q = urlObj.searchParams.get('q');
    const rows = urlObj.searchParams.get('rows') || '20';
    const fields = urlObj.searchParams.get('fl[]') || 'identifier,title,creator,year,subject';
    
    // Build scrape API URL
    transformedUrl = `https://archive.org/services/search/v1/scrape?q=${encodeURIComponent(q)}&fields=${fields}&count=${rows}`;
    
    console.log(`🔄 Transformed IA URL: ${transformedUrl}`);
  }

  // Use the fallback handler from rateLimiter
  return internetArchiveFallback.execute(async () => {
    const rateLimiter = rateLimiters['internetArchive'];
    
    return rateLimiter.schedule(async () => {
      try {
        // Set timeout for Internet Archive (10 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const options = {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BookApp/1.0; +https://yourapp.com)'
          }
        };
        
        const result = await originalFetchJson(transformedUrl, options);
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        // Handle abort/timeout specifically
        if (error.name === 'AbortError') {
          console.error(`⏱️ Internet Archive timeout: ${url}`);
          throw new Error('Internet Archive timeout after 10s');
        }
        
        console.error(`❌ Internet Archive API error:`, error.message);
        throw error;
      }
    });
  }).catch(error => {
    // Return empty result instead of throwing
    console.log(`⚠️ Internet Archive unavailable: ${error.message}`);
    return { items: [], response: { docs: [] } }; // Return empty structure
  });
}

// NEW: Gutenberg specific handler
async function fetchGutenberg(url, options = {}) {
  return fetchWithRateLimit('gutenberg', url, options).catch(error => {
    console.log(`⚠️ Gutenberg unavailable: ${error.message}`);
    return { results: [] };
  });
}

// NEW: OpenLibrary specific handler
async function fetchOpenLibrary(url, options = {}) {
  return fetchWithRateLimit('openlibrary', url, options).catch(error => {
    console.log(`⚠️ OpenLibrary unavailable: ${error.message}`);
    return { works: [], docs: [] };
  });
}

// NEW: MangaDex specific handler
async function fetchMangaDex(url, options = {}) {
  return fetchWithRateLimit('mangadex', url, options).catch(error => {
    console.log(`⚠️ MangaDex unavailable: ${error.message}`);
    return { data: [] };
  });
}

// NEW: Otthor specific handler (no rate limiting needed)
async function fetchOtthor(url, options = {}) {
  return fetchWithRateLimit('otthor', url, options).catch(error => {
    console.log(`⚠️ Otthor unavailable: ${error.message}`);
    return [];
  });
}

// NEW: Retry wrapper for critical requests
async function fetchWithRetry(apiName, url, options = {}, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchWithRateLimit(apiName, url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`🔄 Retry ${i + 1}/${retries} for ${apiName} - ${url}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}

// NEW: Batch fetch for multiple URLs (reduces overhead)
async function fetchBatch(apiName, urls, options = {}) {
  const promises = urls.map(url => 
    fetchWithRateLimit(apiName, url, options)
      .catch(error => ({ error: error.message, url }))
  );
  
  return Promise.all(promises);
}

module.exports = {
  // Main exports
  fetchWithRateLimit,
  fetchInternetArchive,
  fetchGutenberg,
  fetchOpenLibrary,
  fetchMangaDex,
  fetchOtthor,
  
  // Utilities
  fetchWithRetry,
  fetchBatch,
  originalFetchJson
};