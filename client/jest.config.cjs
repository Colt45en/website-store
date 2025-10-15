module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { configFile: './babel.config.cjs' }]
  }
  ,moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  }
  ,setupFiles: ['<rootDir>/tests/setupTests.js']
}
