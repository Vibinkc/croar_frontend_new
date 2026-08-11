import { test, expect } from "@playwright/test";

/**
 * Full Croar Pilot (AI copilot) flow:
 *   1. Log in.
 *   2. Ask the copilot to create a JD / pipeline for an ArcGIS Developer.
 *   3. Confirm the AI-prefilled setup form and build the pipeline (this generates the JD + job).
 *   4. Source 2 candidates for the new role and confirm the candidate picker appears.
 *
 * This drives the real LLM + candidate scraping, so it's slow and needs a test account
 * (TEST_EMAIL / TEST_PASSWORD in frontend/.env.test). NOTE: it creates a real "ArcGIS Developer"
 * job in the account; it does NOT send any invites (never clicks "Send invites").
 */
const EMAIL = process.env.TEST_EMAIL || "";
const PASSWORD = process.env.TEST_PASSWORD || "";
const HAS_CREDS = Boolean(EMAIL && PASSWORD);

test.describe("Croar Pilot — create JD + source candidates", () => {
    test("ArcGIS Developer: login → AI creates JD → source 2 candidates", async ({ page }) => {
        test.skip(!HAS_CREDS, "Set TEST_EMAIL / TEST_PASSWORD in frontend/.env.test to run this flow.");
        test.setTimeout(360_000); // LLM + pipeline build + live candidate sourcing is slow.

        // Suppress the first-run product tour (a fresh browser shows it every run, and its overlay
        // covers the setup form). Marking it "seen" keeps the UI clear.
        await page.addInitScript(() => {
            try {
                window.localStorage.setItem("croar.guide.tourSeen.v1", "true");
            } catch {
                /* ignore */
            }
        });

        // 1. Log in.
        await page.goto("/enterprise/login");
        await page.locator("#email").fill(EMAIL);
        await page.locator("#password").fill(PASSWORD);
        await page.getByRole("button", { name: /sign in to dashboard/i }).click();
        await page.waitForURL(/\/(enterprise|employee)\/dashboard/, { timeout: 30_000 });

        // 2. Open Croar Pilot and ask it to create a JD for an ArcGIS Developer.
        await page.goto("/enterprise/croar-pilot");
        const composer = page.getByPlaceholder(/describe the role you want to hire/i);
        await expect(composer).toBeVisible({ timeout: 20_000 });

        await composer.fill(
            "Create a hiring pipeline for a Senior ArcGIS Developer, remote. Key skills: ArcGIS, GIS, Python, JavaScript, ArcPy.",
        );
        await composer.press("Enter");

        // 3. The copilot returns an interactive setup form (JD/role prefilled from the request).
        const roleInput = page.locator('input[placeholder="e.g. Java Developer"]');
        await expect(roleInput).toBeVisible({ timeout: 90_000 });

        // Make the JD explicitly for ArcGIS Developer (also guarantees the form is valid to build).
        await roleInput.fill("ArcGIS Developer");
        const skillsInput = page.locator('input[placeholder="Java, Spring, SQL"]');
        await skillsInput.fill("ArcGIS, GIS, Python, JavaScript, ArcPy");

        // 4. Advance the 3-step wizard (Role → Interview → Assessment) and build the pipeline.
        // Scope to the setup form's nav (it has a "Previous" button) so we don't hit other "Next"
        // buttons on the page (e.g. the onboarding guide).
        const wizardNav = page.locator("div").filter({ has: page.getByRole("button", { name: /Previous/i }) }).last();
        await wizardNav.getByRole("button", { name: /Next/i }).click(); // -> Interview (AI mode by default)
        await wizardNav.getByRole("button", { name: /Next/i }).click(); // -> Assessment
        await wizardNav.getByRole("button", { name: /build pipeline/i }).click();

        // 5. The pipeline built — the "Source candidates" card appearing confirms the job + JD were
        //    created for the ArcGIS Developer role.
        await expect(page.getByRole("button", { name: /source candidates/i }).last()).toBeVisible({ timeout: 150_000 });

        // 6. Ask the copilot to source 2 candidates for the new role (via the composer — a stable
        //    element — with the count included so it goes straight to sourcing). The composer is
        //    disabled while the copilot is busy, so wait for it to be editable first.
        await expect(composer).toBeEnabled({ timeout: 120_000 });
        await composer.fill("Source 2 candidates for this role.");
        await composer.press("Enter");

        // 7. The candidate picker appears with the sourced profiles (a "Send invites to N selected"
        //    button shows once candidates are listed). We do NOT send invites.
        await expect(page.getByRole("button", { name: /send invites to/i })).toBeVisible({ timeout: 240_000 });
    });
});
