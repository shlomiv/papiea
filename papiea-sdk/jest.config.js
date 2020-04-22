module.exports = {
  roots: ['<rootDir>/__tests__'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '((\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  setupTestFrameworkScriptFile: './jest.setup.js',
  coveragePathIgnorePatterns: ["papiea-lib-clj"],
  modulePathIgnorePatterns: ['.sfs_compiler.ts']
}