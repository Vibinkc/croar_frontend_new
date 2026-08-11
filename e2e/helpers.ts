import { type Page, expect } from "@playwright/test";

/**
 * Shared helpers + credentials for the module scenario tests.
 *
 * The `*.app.spec.ts` suites reuse a logged-in session captured once by `auth.setup.ts`
 * (see playwright.config.ts). They only run when a test account is provided in
 * frontend/.env.test (TEST_EMAIL / TEST_PASSWORD); otherwise every suite is skipped.
 */
export const EMAIL = process.env.TEST_EMAIL || "";
export const PASSWORD = process.env.TEST_PASSWORD || "";
export const HAS_CREDS = Boolean(EMAIL && PASSWORD);
export const NEEDS_CREDS = "Set TEST_EMAIL / TEST_PASSWORD in frontend/.env.test to run these tests.";

/** Path where auth.setup.ts saves the authenticated session. */
export const STORAGE_STATE = "e2e/.auth/user.json";

/** Perform a real recruiter login (used by the auth setup project). */
export async function login(page: Page) {
    await page.goto("/enterprise/login");
    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill(PASSWORD);
    await page.getByRole("button", { name: /sign in to dashboard/i }).click();
    await page.waitForURL(/\/(enterprise|employee)\/dashboard/, { timeout: 30_000 });
}

/**
 * Mark the first-run product tour as "seen" so its overlay never covers the page.
 * Must run before navigation, so call it inside `open()` / a beforeEach.
 */
export async function suppressTour(page: Page) {
    await page.addInitScript(() => {
        try {
            window.localStorage.setItem("croar.guide.tourSeen.v1", "true");
        } catch {
            /* ignore */
        }
    });
}

/**
 * Open an authenticated app route and assert we landed on it (not bounced to login).
 * Returns once the URL is stable so the caller can start asserting on content.
 */
export async function open(page: Page, path: string) {
    await suppressTour(page);
    await page.goto(path);
    await expect(page, `expected ${path} to stay authenticated, not redirect to /login`).not.toHaveURL(
        /\/login/,
        { timeout: 20_000 },
    );
}
