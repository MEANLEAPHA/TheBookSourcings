// util/rateLimiter.js
class RateLimiter {
  constructor(requestsPerSecond, maxQueue = 100) {
    this.requestsPerSecond = requestsPerSecond;
    this.minInterval = 1000 / requestsPerSecond;
    this.lastRequestTime = 0;
    this.queue = [];
    this.processing = false;
    this.maxQueue = maxQueue;
  }

  async schedule(fn) {
    if (this.queue.length > this.maxQueue) {
      throw new Error('Rate limiter queue full');
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }
      
      const { fn, resolve, reject } = this.queue.shift();
      this.lastRequestTime = Date.now();
      
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    
    this.processing = false;
  }
}

class CircuitBreaker {
  constructor(failureThreshold = 5, resetTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }
}

// Create rate limiters for each API
const rateLimiters = {
  gutenberg: new RateLimiter(1),      // 1 req/sec
  openlibrary: new RateLimiter(2),    // 2 req/sec
  mangadex: new RateLimiter(2),       // 2 req/sec
  internetArchive: new RateLimiter(1), // 1 req/sec
  otthor: new RateLimiter(10)         // 10 req/sec (internal DB)
};

// Create circuit breakers
const circuitBreakers = {
  gutenberg: new CircuitBreaker(3, 30000),
  openlibrary: new CircuitBreaker(5, 30000),
  mangadex: new CircuitBreaker(5, 30000),
  internetArchive: new CircuitBreaker(3, 60000) // Longer timeout for IA
};

module.exports = { rateLimiters, circuitBreakers };