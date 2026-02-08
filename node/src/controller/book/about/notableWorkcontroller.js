const fetch = require('node-fetch'); // Add this if not already available
// Cache for Wikidata data
const wikidataCache = new Map();
const LABEL_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for labels (stable)
const ENTITY_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for entities
const NOTABLE_WORKS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for notable works

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of wikidataCache.entries()) {
    if (now - value.timestamp > Math.max(ENTITY_CACHE_DURATION, LABEL_CACHE_DURATION)) {
      wikidataCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

// --- Helper functions ---
async function fetchWithCache(url, cacheKey, cacheDuration) {
  if (wikidataCache.has(cacheKey)) {
    const cached = wikidataCache.get(cacheKey);
    if (Date.now() - cached.timestamp < cacheDuration) {
      return cached.data;
    }
  }
  
  console.log(`🌐 Fetching Wikidata: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
  const data = await res.json();
  
  wikidataCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  // Limit cache size
  if (wikidataCache.size > 500) {
    const firstKey = wikidataCache.keys().next().value;
    wikidataCache.delete(firstKey);
  }
  
  return data;
}

async function fetchWikidataEntity(qid) {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const cacheKey = `entity:${qid}`;
  const data = await fetchWithCache(url, cacheKey, ENTITY_CACHE_DURATION);
  return data.entities[qid];
}

async function resolveLabels(ids) {
  if (!ids.length) return { labels: {} };
  
  // Check cache first
  const cacheKey = `labels:${ids.sort().join('|')}`;
  if (wikidataCache.has(cacheKey)) {
    const cached = wikidataCache.get(cacheKey);
    if (Date.now() - cached.timestamp < LABEL_CACHE_DURATION) {
      return cached.data;
    }
  }
  
  // Batch requests (max 50 IDs per request)
  const batches = [];
  for (let i = 0; i < ids.length; i += 50) {
    batches.push(ids.slice(i, i + 50));
  }
  
  const batchPromises = batches.map(async (batchIds) => {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batchIds.join(
      "|"
    )}&props=labels&languages=en&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to resolve labels");
    return await res.json();
  });
  
  const batchResults = await Promise.all(batchPromises);
  
  // Merge results
  const labels = {};
  batchResults.forEach(result => {
    Object.entries(result.entities || {}).forEach(([id, entity]) => {
      labels[id] = entity?.labels?.en?.value || id;
    });
  });
  
  // Fill missing with ID
  ids.forEach(id => {
    if (!labels[id]) labels[id] = id;
  });
  
  const result = { labels };
  
  wikidataCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
}

function getItemIds(entity, property) {
  return (
    entity?.claims?.[property]
      ?.map((c) => c.mainsnak?.datavalue?.value?.id)
      .filter(Boolean) || []
  );
}

function getStrings(entity, property) {
  return (
    entity?.claims?.[property]
      ?.map((c) => c.mainsnak?.datavalue?.value)
      .filter(Boolean) || []
  );
}

function fileToCommonsUrl(filename) {
  if (!filename) return "";
  const clean = filename.replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    clean
  )}`;
}

// --- Source ID detection (optimized) ---
const SOURCE_PROPERTIES = [
  { prop: "P2034", source: "gutenberg" },    // Gutenberg
  { prop: "P648", source: "openlibrary" },   // Open Library
  { prop: "P724", source: "internetarchive" }, // Internet Archive
  { prop: "P11939", source: "mangadex" },    // MangaDex
  { prop: "P212", source: "google" },        // ISBN-13
  { prop: "P957", source: "google" },        // ISBN-10
];

function detectSourceAndId(entity) {
  for (const { prop, source } of SOURCE_PROPERTIES) {
    const ids = getStrings(entity, prop);
    if (ids.length > 0) {
      const id = ids[0];
      if (source === "google") {
        return { source, id: `ISBN${id}` };
      }
      return { source, id };
    }
  }
  return { source: "unknown", id: null };
}

// --- Fetch book info with caching ---
const bookInfoCache = new Map();
async function fetchBookInfo(qid) {
  // Check book info cache
  if (bookInfoCache.has(qid)) {
    const cached = bookInfoCache.get(qid);
    if (Date.now() - cached.timestamp < ENTITY_CACHE_DURATION) {
      return cached.data;
    }
  }
  
  const entity = await fetchWikidataEntity(qid);
  if (!entity) return { cover: "", sourceInfo: null, metadata: {} };

  // Get cover image
  const cover = getStrings(entity, "P5775")[0] || getStrings(entity, "P18")[0] || "";
  
  // Get source and ID
  const sourceInfo = detectSourceAndId(entity);
  
  // Get metadata
  const metadata = {
    title: entity.labels?.en?.value || "",
    authorIds: getItemIds(entity, "P50"),
    publicationDate: getStrings(entity, "P577")[0] || "",
    publisher: getStrings(entity, "P123")[0] || "",
    language: getStrings(entity, "P407")[0] || "",
    genreIds: getItemIds(entity, "P136")
  };

  const result = {
    cover: fileToCommonsUrl(cover),
    sourceInfo,
    metadata
  };
  
  // Cache book info
  bookInfoCache.set(qid, {
    data: result,
    timestamp: Date.now()
  });
  
  if (bookInfoCache.size > 300) {
    const firstKey = bookInfoCache.keys().next().value;
    bookInfoCache.delete(firstKey);
  }
  
  return result;
}

// --- Main controller with caching ---
async function getAuthorNotableWorks(req, res) {
  try {
    const { wikiId } = req.params;
    if (!wikiId) return res.status(400).json({ error: "QID required" });

    // Check notable works cache
    const notableCacheKey = `notable:${wikiId}`;
    if (wikidataCache.has(notableCacheKey)) {
      const cached = wikidataCache.get(notableCacheKey);
      if (Date.now() - cached.timestamp < NOTABLE_WORKS_CACHE_DURATION) {
        console.log(`📦 Notable works cache hit: ${wikiId}`);
        return res.json(cached.data);
      }
    }

    console.log(`🌐 Fetching notable works for: ${wikiId}`);
    
    // 1. Get author entity
    const entity = await fetchWikidataEntity(wikiId);
    if (!entity) return res.status(404).json({ error: "Entity not found" });

    // 2. Get notable works IDs
    const workIds = getItemIds(entity, "P800");
    if (!workIds.length) {
      const emptyResult = { notableWorks: [], authorInfo: getAuthorInfo(entity) };
      wikidataCache.set(notableCacheKey, {
        data: emptyResult,
        timestamp: Date.now()
      });
      return res.json(emptyResult);
    }

    // 3. Get labels for all works in parallel
    const { labels: labelMap } = await resolveLabels(workIds);

    // 4. Fetch book info for all works in parallel (limited concurrency)
    const works = [];
    const batchSize = 5; // Process 5 at a time to avoid rate limiting
    
    for (let i = 0; i < workIds.length; i += batchSize) {
      const batch = workIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (id) => {
        try {
          const { cover, sourceInfo, metadata } = await fetchBookInfo(id);
          return {
            qid: id,
            name: labelMap[id],
            cover: cover || "/assets/img/noCoverFound.png",
            source: sourceInfo.source,
            bookId: sourceInfo.id,
            title: metadata.title || labelMap[id],
            publicationDate: metadata.publicationDate,
            publisher: metadata.publisher,
            language: metadata.language
          };
        } catch (err) {
          console.error(`Error fetching book ${id}:`, err.message);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      works.push(...batchResults.filter(Boolean));
      
      // Small delay between batches to be nice to Wikidata
      if (i + batchSize < workIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 5. Prepare response
    const result = { 
      notableWorks: works,
      authorInfo: getAuthorInfo(entity),
      _cached: true,
      _fetchedAt: new Date().toISOString()
    };

    // 6. Cache the result
    wikidataCache.set(notableCacheKey, {
      data: result,
      timestamp: Date.now()
    });

    console.log(`✅ Notable works fetched and cached: ${wikiId} (${works.length} works)`);
    res.json(result);
    
  } catch (err) {
    console.error("getAuthorNotableWorks error:", err.message);
    
    // Try to serve stale cache on error
    const notableCacheKey = `notable:${req.params.wikiId}`;
    if (wikidataCache.has(notableCacheKey)) {
      console.log(`🔄 Serving stale cache due to error: ${req.params.wikiId}`);
      const cached = wikidataCache.get(notableCacheKey);
      cached.data._stale = true;
      return res.json(cached.data);
    }
    
    res.status(500).json({ error: "Failed to fetch notable works" });
  }
}

function getAuthorInfo(entity) {
  return {
    name: entity.labels?.en?.value || "",
    description: entity.descriptions?.en?.value || "",
    birthDate: getStrings(entity, "P569")[0] || "",
    deathDate: getStrings(entity, "P570")[0] || "",
    occupation: getStrings(entity, "P106")[0] || "",
    image: fileToCommonsUrl(getStrings(entity, "P18")[0] || "")
  };
}

// Optional cache stats endpoint
// function getWikidataCacheStats(req, res) {
//   const entityCacheSize = Array.from(wikidataCache.keys())
//     .filter(k => k.startsWith('entity:')).length;
//   const labelCacheSize = Array.from(wikidataCache.keys())
//     .filter(k => k.startsWith('labels:')).length;
//   const notableCacheSize = Array.from(wikidataCache.keys())
//     .filter(k => k.startsWith('notable:')).length;
  
//   res.json({
//     totalCacheSize: wikidataCache.size,
//     bookInfoCacheSize: bookInfoCache.size,
//     entityCacheSize,
//     labelCacheSize,
//     notableCacheSize,
//     durations: {
//       labels: `${LABEL_CACHE_DURATION / 3600000}h`,
//       entities: `${ENTITY_CACHE_DURATION / 3600000}h`,
//       notableWorks: `${NOTABLE_WORKS_CACHE_DURATION / 60000}min`
//     }
//   });
// }

module.exports = { 
  getAuthorNotableWorks
  // getWikidataCacheStats // Optional
};