import { test as setup } from "@playwright/test";
import { HAS_CREDS, NEEDS_CREDS, STORAGE_STATE, login } from "./helpers";

/**
 * Auth "setup" project — runs ONCE before the module suites and saves the logged-in session to
 * STORAGE_STATE, which every `*.app.spec.ts` reuses (so we log in once, not per test).
 * Skipped (and the app suites with it) when no test account is configured.
 */
setup("authenticate once and save session", async ({ page }) => {
    setup.skip(!HAS_CREDS, NEEDS_CREDS);

    await login(page);

    // Persist "tour seen" into the saved session so the first-run overlay never appears.
    await page.evaluate(() => {
        try {
            window.localStorage.setItem("croar.guide.tourSeen.v1", "true");
        } catch {
            /* ignore */
        }
    });

    await page.context().storageState({ path: STORAGE_STATE });
});
