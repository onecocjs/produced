const path = require("path");
module.exports = {
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: ["src/*.{js,jsx,ts,tsx}"],
  coverageReporters: ["text", "lcov", "json"],
  transformIgnorePatterns: [],
};
