module.exports = {
  roots: ['<rootDir>/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testPathIgnorePatterns: ['test/unit']
};
