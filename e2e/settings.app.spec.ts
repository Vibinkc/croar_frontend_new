import { test, expect } from "@playwright/test";
import { HAS_CREDS, NEEDS_CREDS, open, suppressTour } from "./helpers";

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  MODULE: Settings                                                          │
 * │  General · Team · Permissions · Templates                                  │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
test.describe("Settings", () => {
    test.skip(!HAS_CREDS, NEEDS_CREDS);
    test.beforeEach(async ({ page }) => {
        await suppressTour(page);
    });

    test("General — organization profile renders", async ({ page }) => {
        // Scenario: an admin opens the organization/general settings.
        await open(page, "/enterprise/settings");
        await expect(page.getByRole("heading", { name: /organization profile/i })).toBeVisible({ timeout: 20_000 });
    });

    test("Team — member management renders and invite is available", async ({ page }) => {
        // Scenario: an admin reviews the team and can invite a member.
        await open(page, "/enterprise/team");
        await expect(page.getByRole("heading", { name: /team management/i })).toBeVisible({ timeout: 20_000 });
        await expect(page.getByRole("button", { name: /invite|add member|add user/i }).first()).toBeVisible();
    });

    test("Permissions — roles & permissions matrix renders", async ({ page }) => {
        // Scenario: an admin reviews role-based access. (RBAC is exact per (module, action).)
        await open(page, "/enterprise/settings/roles");
        await expect(page.getByRole("heading", { name: /roles & permissions/i })).toBeVisible({ timeout: 20_000 });
    });

    test("Templates — templates hub renders with its sub-tabs", async ({ page }) => {
        // Scenario: an admin opens the templates hub (email / assessment / interview / onboarding).
        await open(page, "/enterprise/templates");
        await expect(page.getByRole("heading", { name: /templates hub/i })).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(/email|assessment|interview|onboarding/i).first()).toBeVisible();
    });
});
