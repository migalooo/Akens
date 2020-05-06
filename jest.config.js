module.exports = {
  silent: true,
  testEnvironment: 'jsdom',
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
    "PIXI": "<rootDir>/test/mock/PIXI.ts",
  },
  setupFiles:["jest-canvas-mock"],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}
