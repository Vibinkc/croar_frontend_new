import { test, expect, type Page } from "@playwright/test";

/**
 * Authentication flow for the recruiter portal — all in one group.
 * The valid-login / session / logout tests need a test account in frontend/.env.test
 * (TEST_EMAIL / TEST_PASSWORD); without it they're skipped.
 */
const EMAIL = process.env.TEST_EMAIL || "";
const PASSWORD = process.env.TEST_PASSWORD || "";
const HAS_CREDS = Boolean(EMAIL && PASSWORD);
const NEEDS_CREDS = "Set TEST_EMAIL / TEST_PASSWORD in frontend/.env.test to run this test.";

async function submitLogin(page: Page, email: string, password: string) {
    await page.goto("/enterprise/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /sign in to dashboard/i }).click();
}

test.describe("Auth", () => {
    test("login page renders the form", async ({ page }) => {
        await page.goto("/enterprise/login");
        await expect(page.locator("#email")).toBeVisible();
        await expect(page.locator("#password")).toBeVisible();
        await expect(page.getByRole("button", { name: /sign in to dashboard/i })).toBeVisible();
    });

    test("logged-out user is redirected to login from a protected page", async ({ page }) => {
        await page.goto("/enterprise/candidates");
        await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    });

    test("rejects invalid credentials and stays on login", async ({ page }) => {
        await submitLogin(page, "no-such-user@example.com", "definitely-wrong-password");
        await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 15_000 });
        await expect(page).toHaveURL(/\/login/);
    });

    test("valid login lands on the dashboard", async ({ page }) => {
        test.skip(!HAS_CREDS, NEEDS_CREDS);
        await submitLogin(page, EMAIL, PASSWORD);
        await page.waitForURL(/\/(enterprise|employee)\/dashboard/, { timeout: 30_000 });
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    });

    test("session persists across navigation and reload", async ({ page }) => {
        test.skip(!HAS_CREDS, NEEDS_CREDS);
        await submitLogin(page, EMAIL, PASSWORD);
        await page.waitForURL(/\/(enterprise|employee)\/dashboard/, { timeout: 30_000 });

        await page.goto("/enterprise/candidates");
        await expect(page.getByRole("heading", { name: "Candidate Bank" })).toBeVisible({ timeout: 20_000 });
        await page.reload();
        await expect(page).not.toHaveURL(/\/login/);
    });

    test("logout returns to login and re-protects pages", async ({ page }) => {
        test.skip(!HAS_CREDS, NEEDS_CREDS);
        await submitLogin(page, EMAIL, PASSWORD);
        await page.waitForURL(/\/(enterprise|employee)\/dashboard/, { timeout: 30_000 });

        await page.getByText("Logout", { exact: true }).click();
        await expect(page).toHaveURL(/\/enterprise\/login/, { timeout: 20_000 });

        await page.goto("/enterprise/candidates");
        await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    });
});
