// util/apiClient.js
const { rateLimiters, circuitBreakers } = require('./rateLimiter');
const { fetchJson: originalFetchJson } = require('./apiClient'); // Your existing fetchJson

// Enhanced fetch with rate limiting and circuit breaker
async function fetchWithRateLimit(apiName, url, options = {}) {
  const rateLimiter = rateLimiters[apiName];
  const circuitBreaker = circuitBreakers[apiName];
  
  if (!rateLimiter) {
    return originalFetchJson(url, options);
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

// Special handler for Internet Archive (fix 400 errors)
async function fetchInternetArchive(url, useScrape = true) {
  // Internet Archive's advancedsearch.php often fails with 400
  // Use the scrape API which is more reliable
  if (url.includes('advancedsearch.php') && useScrape) {
    url = url.replace('advancedsearch.php', 'services/search/v1/scrape')
             .replace('&output=json', '')
             .replace('&fl[]=', 'fields=');
  }
  
  return fetchWithRateLimit('internetArchive', url);
}

module.exports = {
  fetchWithRateLimit,
  fetchInternetArchive,
  originalFetchJson
};