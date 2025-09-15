const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  // moduleNameMapper: {
  //   '^@/(.*)$': '<rootDir>',
  // },
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '\\.spec\\.ts'],
};

module.exports = createJestConfig(customJestConfig);
