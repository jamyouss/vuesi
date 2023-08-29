module.exports = {
  moduleNameMapper: {
    '^vue$': 'vue/dist/vue.common.js',
    '#imports': '<rootDir>/playground/.nuxt/imports.d.ts',
  },
  preset: "ts-jest",
  moduleFileExtensions: ["vue", "js", "ts"],
  modulePathIgnorePatterns: [
    "<rootDir>/dist/",
    "<rootDir>/node_modules/"
  ],
  collectCoverageFrom: [
    "src/**/*.{js,ts,vue}"
  ],
  coveragePathIgnorePatterns: [
    "<rootDir>/node_modules/"
  ],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.ts$": "ts-jest",
    "^.+\\.js$": "ts-jest",
    "^.+\\.vue$": "@vue/vue3-jest"
  }
}
