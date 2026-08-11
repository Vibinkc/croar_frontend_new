 import { test, expect } from "@playwright/test";

test.describe("Auth · login page", () => {
    test("renders the login form", async ({ page }) => {
        await page.goto("/enterprise/login");
        await expect(page.locator("#email")).toBeVisible();
        await expect(page.locator("#password")).toBeVisible();
        await expect(page.getByRole("button", { name: /sign in to dashboard/i })).toBeVisible();
    });
});
