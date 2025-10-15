// Small helper for computing nextAttempt using exponential backoff + jitter
function computeNextAttempt(attempts, baseDelay = 2000, maxDelay = 60000, jitterMax = 1000){
  const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempts))
  const jitter = jitterMax > 0 ? Math.floor(Math.random() * jitterMax) : 0
  return Date.now() + delay + jitter
}

module.exports = { computeNextAttempt }
