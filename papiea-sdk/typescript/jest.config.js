module.exports = {
  roots: ['<rootDir>/__tests__'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '((\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  setupTestFrameworkScriptFile: './jest.setup.js',
  coveragePathIgnorePatterns: ["node_modules"],
  modulePathIgnorePatterns: ['node_modules']
}
