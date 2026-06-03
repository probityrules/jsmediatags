/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  testPathIgnorePatterns: ["/node_modules/", "/build/"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json",
        diagnostics: {
          ignoreCodes: [2794, 2339, 7034, 7005, 7006],
        },
      },
    ],
  },
};
