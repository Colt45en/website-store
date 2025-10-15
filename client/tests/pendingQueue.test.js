const { computeNextAttempt } = require('../src/lib/pendingQueue')

test('computeNextAttempt increases with attempts', () => {
  const a0 = computeNextAttempt(0, 100, 10000, 0)
  const a1 = computeNextAttempt(1, 100, 10000, 0)
  const a2 = computeNextAttempt(2, 100, 10000, 0)
  expect(a1).toBeGreaterThanOrEqual(a0)
  expect(a2).toBeGreaterThanOrEqual(a1)
})

test('computeNextAttempt caps at maxDelay', () => {
  const a = computeNextAttempt(10, 100, 500)
  const now = Date.now()
  expect(a - now).toBeLessThanOrEqual(500 + 1000) // include jitter
})
