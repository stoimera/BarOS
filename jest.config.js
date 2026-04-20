const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/app/api/operations/event-commerce/**/*.ts',
    'src/lib/operations/orders.ts',
    'src/lib/operations/payments.ts',
    'src/lib/operations/state-machine.ts',
    'src/lib/operations/ticket-inventory.ts',
    'src/lib/operations/split-bills.ts',
    'src/lib/operations/voids.ts',
    'src/lib/operations/order-events.ts',
    'src/lib/operations/procurement.ts',
    'src/lib/operations/stocktakes.ts',
    'src/lib/operations/recipes.ts',
    'src/lib/operations/inventory-variance.ts',
    'src/lib/operations/inventory-waste-ledger.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 59,
      functions: 80,
      lines: 80,
      statements: 75,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/out/',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 10000,
  verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 