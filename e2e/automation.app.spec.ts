import { test, expect } from "@playwright/test";
import { HAS_CREDS, NEEDS_CREDS, open, suppressTour } from "./helpers";

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  MODULE: Automation                                                        │
 * │  Canvas · Mail · Assessment · Interview · Onboarding                       │
 * └─────────────────────────────────────────────────────────────────────────┘
 * These pages arm the automatic hiring funnel (stage emails, assessments,
 * interviews, onboarding) tied to a job requirement.
 */
test.describe("Automation", () => {
    test.skip(!HAS_CREDS, NEEDS_CREDS);
    test.beforeEach(async ({ page }) => {
        await suppressTour(page);
    });

    test("Canvas — the automation canvas renders", async ({ page }) => {
        // Scenario: recruiter opens the automation canvas overview of the hiring funnel.
        await open(page, "/enterprise/automation");
        await expect(page.getByRole("heading", { name: /automation canvas/i })).toBeVisible({ timeout: 20_000 });
    });

    test("Mail automation — pick a job requirement to configure a rule", async ({ page }) => {
        // Scenario: recruiter sets up an automatic stage email for a specific job.
        await open(page, "/enterprise/automation/mail");
        await expect(page.getByText(/rule configuration/i)).toBeVisible({ timeout: 20_000 });

        // The job-requirement selector is the entry point for configuring a mail rule.
        const jobSelect = page.getByRole("combobox").first();
        await expect(jobSelect).toBeVisible();
        await expect(jobSelect.getByRole("option", { name: /all job requirements/i })).toHaveCount(1);
    });

    test("Assessment automation — rule configuration renders", async ({ page }) => {
        // Scenario: recruiter arms an auto-sent assessment for a job's assessment stage.
        await open(page, "/enterprise/automation/assessment");
        await expect(page.getByText(/rule configuration|job & assessment topic/i).first()).toBeVisible({
            timeout: 20_000,
        });
    });

    test("Interview automation — page renders", async ({ page }) => {
        // Scenario: recruiter configures the automatic interview stage (AI or human).
        await open(page, "/enterprise/automation/interview");
        await expect(page.getByRole("heading", { name: /interview automation/i })).toBeVisible({ timeout: 20_000 });
    });

    test("Onboarding automation — page renders", async ({ page }) => {
        // Scenario: recruiter arms auto-onboarding at the final stage of a job.
        await open(page, "/enterprise/automation/onboarding");
        await expect(page.getByRole("heading", { name: /onboarding automation/i })).toBeVisible({ timeout: 20_000 });
    });
});
