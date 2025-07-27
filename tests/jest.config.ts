import type { Config } from "jest"

const config: Config = {
    rootDir: "..",
    verbose: true,
    preset: "ts-jest",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
    testPathIgnorePatterns: [
        "<rootDir>/.next/",
        "<rootDir>/node_modules/",
        "<rootDir>/tests/e2e/"
    ],
    transform: {
        "^.+\\.(t|j)sx?$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/tests/tsconfig.jest.json",
            },
        ],
    },
}

export default config 