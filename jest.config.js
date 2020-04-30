module.exports = {
  testEnvironment: 'jsdom',
  rootDir: '',
  roots: [
    "<rootDir>/test"
  ],
  testRegex: 'test/(.+)\\.test\\.(jsx?|tsx?)$',
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleDirectories: [
    "node_modules"
  ],
  moduleNameMapper: {
    "PIXI": "<rootDir>/static/pixi-v1.6.0.js",
  },
  testPathIgnorePatterns: [
    "<rootDir>/static/"
  ],
  setupFiles:["jest-canvas-mock"],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}
