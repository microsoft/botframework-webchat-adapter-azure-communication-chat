module.exports = {
  roots: ['<rootDir>/'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  testPathIgnorePatterns: ['test/integration'],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(p-defer|uuid|@azure|@azure-rest|@azure/core-util|@typespec/ts-http-runtime)/.*)'
  ],
  testEnvironment: 'jsdom',
  coverageProvider: 'v8',
  coverageDirectory: './temp/jest-coverage/'
};
