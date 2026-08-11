import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load a LOCAL, git-ignored creds file so the password never lives in source or shell history.
// Create frontend/.env.test (see .env.test.example) with TEST_EMAIL / TEST_PASSWORD / BASE_URL.
dotenv.config({ path: ".env.test" });

const BASE_URL = process.env.BASE_URL || "https://app.croar.co";

export default defineConfig({
    testDir: "./e2e",
    timeout: 60_000,
    expect: { timeout: 15_000 },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
    },
    projects: [
        // 1) Log in once and save the session for the module suites.
        { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },

        // 2) Raw auth-flow tests run WITHOUT a saved session (they test login/logout themselves).
        { name: "authflow", testMatch: /auth\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },

        // 3) The Croar Pilot end-to-end flow logs in itself, so it also runs without a saved session.
        { name: "flows", testMatch: /pilot-hiring-flow\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },

        // 4) Per-module scenario suites (*.app.spec.ts) reuse the session captured by "setup".
        {
            name: "app",
            testMatch: /\.app\.spec\.ts/,
            dependencies: ["setup"],
            use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
        },
    ],
});
