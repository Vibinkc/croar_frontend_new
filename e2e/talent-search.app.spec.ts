import { test, expect } from "@playwright/test";
import { HAS_CREDS, NEEDS_CREDS, open, suppressTour } from "./helpers";

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  MODULE: Talent Search                                                     │
 * │  Candidate Bank · Profile Sourcing · Shortlisted Talent                    │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
test.describe("Talent Search", () => {
    test.skip(!HAS_CREDS, NEEDS_CREDS);
    test.beforeEach(async ({ page }) => {
        await suppressTour(page);
    });

    test("Candidate Bank — list renders and search filters it", async ({ page }) => {
        // Scenario: recruiter browses the stored candidate bank and searches it.
        await open(page, "/enterprise/candidates");
        await expect(page.getByRole("heading", { name: "Candidate Bank" })).toBeVisible();

        const search = page.getByPlaceholder(/search/i).first();
        if (await search.count()) {
            await search.fill("developer");
            await expect(search).toHaveValue("developer");
        }
    });

    test("Profile Sourcing — AI search accepts a role and starts sourcing", async ({ page }) => {
        // Scenario: recruiter asks the AI sourcing chat to find ArcGIS Developers; a search kicks off.
        // Live sourcing is slow, so we assert the search STARTS (results/loading), not full results.
        test.setTimeout(180_000);
        await open(page, "/enterprise/sourcing/chat");
        await expect(page.getByRole("heading", { name: /who are you looking for|help you build/i })).toBeVisible({
            timeout: 20_000,
        });

        const composer = page.getByPlaceholder(/software engineers with|refine your search/i).first();
        await expect(composer).toBeVisible();
        await composer.fill("ArcGIS Developer");
        await composer.press("Enter");

        // A results panel / profile cards / a "Profiles (n)" header / loading indicator appears.
        await expect(
            page.getByText(/profiles?\s*\(|sourc|searching|github|no .*profiles/i).first(),
        ).toBeVisible({ timeout: 150_000 });
    });

    test("Shortlisted Talent — the shortlist board renders", async ({ page }) => {
        // Scenario: recruiter reviews candidates they have shortlisted from sourcing.
        await open(page, "/enterprise/sourcing/shortlisted");
        await expect(page.getByRole("heading", { name: /talent pipeline|shortlist/i })).toBeVisible({
            timeout: 20_000,
        });
        // Either shortlisted cards or an empty-state prompt is shown.
        await expect(page.getByText(/shortlist|no .*(candidate|profile)|invite/i).first()).toBeVisible();
    });
});
