export default {
  // The root directory that Jest should scan for tests and modules
  roots: ['<rootDir>/src'],

  // A list of paths to directories that Jest should use to search for files in
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],

  // An array of file extensions Jest should look for
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

  // Transform files with babel-jest
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Handle CSS, image, and other file imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/tests/__mocks__/fileMock.js',
  },

  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.js'],

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // Ignore node_modules
  transformIgnorePatterns: ['/node_modules/'],

  // Collect coverage from src directory
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/main.jsx',
    '!**/node_modules/**',
  ],

  // Configure coverage directory
  coverageDirectory: 'coverage',

  // Configure coverage thresholds
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};