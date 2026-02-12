// util/rateLimiter.js

class RateLimiter {
  constructor(requestsPerSecond, maxQueue = 100) {
    this.requestsPerSecond = requestsPerSecond;
    this.minInterval = 1000 / requestsPerSecond;
    this.lastRequestTime = 0;
    this.queue = [];
    this.processing = false;
    this.maxQueue = maxQueue;
    this.stats = {
      total: 0,
      failed: 0,
      lastReset: Date.now()
    };
  }

  async schedule(fn) {
    if (this.queue.length > this.maxQueue) {
      console.warn(`⚠️ Rate limiter queue full (${this.maxQueue})`);
      // Don't throw - just execute immediately as fallback
      return fn();
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
      this.stats.total++;
      
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        this.stats.failed++;
        reject(error);
      }
    }
    
    this.processing = false;
  }

  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      isProcessing: this.processing
    };
  }
}

class CircuitBreaker {
  constructor(failureThreshold = 5, resetTimeout = 60000, serviceName = 'unknown') {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.serviceName = serviceName;
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.successfulTests = 0;
    this.totalRequests = 0;
  }

  async execute(fn) {
    this.totalRequests++;
    
    // OPEN state - check if we can try again
    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      
      if (timeSinceFailure > this.resetTimeout) {
        console.log(`🔄 ${this.serviceName} circuit HALF_OPEN - testing recovery`);
        this.state = 'HALF_OPEN';
        this.successfulTests = 0;
      } else {
        const waitTimeRemaining = Math.round((this.resetTimeout - timeSinceFailure) / 1000);
        throw new Error(`${this.serviceName} circuit breaker is OPEN (retry in ${waitTimeRemaining}s)`);
      }
    }

    // HALF_OPEN - only allow 1 request through
    if (this.state === 'HALF_OPEN') {
      try {
        const result = await fn();
        
        // Success! Close the circuit
        this.successfulTests++;
        
        if (this.successfulTests >= 2) { // Need 2 successful tests to close
          console.log(`✅ ${this.serviceName} circuit CLOSED - recovered`);
          this.state = 'CLOSED';
          this.failures = 0;
          this.successfulTests = 0;
        }
        
        return result;
      } catch (error) {
        // Failed again - back to OPEN
        console.log(`🔴 ${this.serviceName} circuit OPEN again - recovery failed`);
        this.state = 'OPEN';
        this.lastFailureTime = Date.now();
        this.successfulTests = 0;
        throw error;
      }
    }

    // CLOSED - normal operation
    try {
      const result = await fn();
      // Reset failures on success
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      console.log(`⚠️ ${this.serviceName} failure ${this.failures}/${this.failureThreshold}: ${error.message}`);
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        console.log(`🔴 ${this.serviceName} circuit OPEN - too many failures`);
      }
      
      throw error;
    }
  }

  getState() {
    return {
      service: this.serviceName,
      state: this.state,
      failures: this.failures,
      threshold: this.failureThreshold,
      resetTimeout: this.resetTimeout,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      totalRequests: this.totalRequests
    };
  }

  // Manual reset (for emergencies)
  reset() {
    console.log(`🔄 Manual reset of ${this.serviceName} circuit breaker`);
    this.state = 'CLOSED';
    this.failures = 0;
    this.successfulTests = 0;
    this.lastFailureTime = 0;
  }
}

// Create rate limiters with optimized settings
const rateLimiters = {
  gutenberg: new RateLimiter(1),        // 1 req/sec - Gutendex is strict
  openlibrary: new RateLimiter(4),      // 4 req/sec - OpenLibrary is generous
  mangadex: new RateLimiter(4),         // 4 req/sec - MangaDex allows more
  internetArchive: new RateLimiter(2),  // 2 req/sec - Increased from 1
  otthor: new RateLimiter(20)          // 20 req/sec - Internal DB, high limit
};

// Create circuit breakers with optimized settings
const circuitBreakers = {
  gutenberg: new CircuitBreaker(3, 30000, 'Gutenberg'),        // 3 failures, 30s reset
  openlibrary: new CircuitBreaker(5, 20000, 'OpenLibrary'),    // 5 failures, 20s reset
  mangadex: new CircuitBreaker(5, 20000, 'MangaDex'),          // 5 failures, 20s reset
  internetArchive: new CircuitBreaker(2, 15000, 'InternetArchive') // 2 failures, 15s reset (more aggressive)
};

// Special handler for Internet Archive with fallback
const internetArchiveFallback = {
  isEnabled: true,
  
  async execute(fn) {
    if (!this.isEnabled) {
      throw new Error('Internet Archive is disabled');
    }
    
    try {
      return await circuitBreakers.internetArchive.execute(fn);
    } catch (error) {
      // After 3 failures in a row, disable for 5 minutes
      if (error.message.includes('circuit breaker is OPEN')) {
        const state = circuitBreakers.internetArchive.getState();
        if (state.failures >= circuitBreakers.internetArchive.failureThreshold * 2) {
          console.log('🚫 Internet Archive disabled for 5 minutes - too many failures');
          this.isEnabled = false;
          
          // Re-enable after 5 minutes
          setTimeout(() => {
            console.log('🔄 Internet Archive re-enabled');
            this.isEnabled = true;
            circuitBreakers.internetArchive.reset();
          }, 300000);
        }
      }
      throw error;
    }
  }
};

// // Health check function
// async function checkAllServices() {
//   const status = {
//     rateLimiters: {},
//     circuitBreakers: {}
//   };
  
//   for (const [name, limiter] of Object.entries(rateLimiters)) {
//     status.rateLimiters[name] = limiter.getStats();
//   }
  
//   for (const [name, breaker] of Object.entries(circuitBreakers)) {
//     status.circuitBreakers[name] = breaker.getState();
//   }
  
//   status.internetArchiveEnabled = internetArchiveFallback.isEnabled;
  
//   return status;
// }

// // Reset all circuit breakers (for emergencies)
// function resetAllCircuits() {
//   console.log('🔄 Resetting all circuit breakers');
//   for (const breaker of Object.values(circuitBreakers)) {
//     breaker.reset();
//   }
//   internetArchiveFallback.isEnabled = true;
// }

// Auto-reset Internet Archive every hour
setInterval(() => {
  if (circuitBreakers.internetArchive.state === 'OPEN') {
    console.log('🔄 Auto-resetting Internet Archive circuit breaker');
    circuitBreakers.internetArchive.reset();
    internetArchiveFallback.isEnabled = true;
  }
}, 60000); // Check every minute

module.exports = { 
  rateLimiters, 
  circuitBreakers,
  internetArchiveFallback
//   checkAllServices,
//   resetAllCircuits
};