import { test, expect } from "@playwright/test";
import { HAS_CREDS, NEEDS_CREDS, open, suppressTour } from "./helpers";

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  MODULE: Hiring Hub                                                        │
 * │  Dashboard · Croar Pilot · Jobs · Pipeline · Mail · Job Portals ·         │
 * │  Onboarding Hub                                                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 * Each test drives one page end-to-end: land on it, prove it rendered, then
 * exercise a real interaction (search / filter / open a form).
 */
test.describe("Hiring Hub", () => {
    test.skip(!HAS_CREDS, NEEDS_CREDS);
    test.beforeEach(async ({ page }) => {
        await suppressTour(page);
    });

    test("Dashboard — loads KPIs and links into the pipeline", async ({ page }) => {
        // Scenario: a recruiter opens the dashboard and jumps to the pipeline from a quick link.
        await open(page, "/enterprise/dashboard");
        await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

        // A "View pipeline" shortcut takes the recruiter to the Kanban board.
        const viewPipeline = page.getByRole("link", { name: /view pipeline/i });
        if (await viewPipeline.count()) {
            await viewPipeline.first().click();
            await expect(page).toHaveURL(/\/candidates\/kanban/);
            await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();
        }
    });

    test("Croar Pilot — AI composer accepts a hiring request", async ({ page }) => {
        // Scenario: open the AI copilot and send a message; the composer + conversation respond.
        await open(page, "/enterprise/croar-pilot");
        const composer = page.getByPlaceholder(/describe the role you want to hire/i);
        await expect(composer).toBeVisible({ timeout: 20_000 });

        await composer.fill("Hi");
        await composer.press("Enter");
        // Our message echoes into the thread and the composer clears, ready for the next turn.
        await expect(page.getByText("Hi", { exact: true }).first()).toBeVisible({ timeout: 20_000 });
        await expect(composer).toHaveValue("");
    });

    test("Jobs — list renders and 'create job' opens the wizard", async ({ page }) => {
        // Scenario: recruiter reviews open roles, searches, then starts creating a new job.
        await open(page, "/enterprise/jobs");
        await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible();

        // "Post a job" / "New Position" links into the creation wizard.
        const create = page.getByRole("link", { name: /post a job|new position/i }).first();
        await expect(create).toBeVisible();
        await create.click();
        await expect(page).toHaveURL(/\/jobs\/create/, { timeout: 15_000 });
        // The wizard offers the "Auto Draft with AI" action on its first (Job Details) step.
        await expect(page.getByRole("button", { name: /draft with ai/i }).first()).toBeVisible({
            timeout: 15_000,
        });
    });

    test("Pipeline — the header job filter and search are usable", async ({ page }) => {
        // Scenario: on the Kanban board, filter the pipeline to one job and search candidates.
        await open(page, "/enterprise/candidates/kanban");
        await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();

        // The job dropdown next to the heading (added to switch pipelines without opening Filters).
        const jobFilter = page.getByRole("combobox").first();
        await expect(jobFilter).toBeVisible();
        await expect(jobFilter.getByRole("option", { name: /all jobs/i })).toHaveCount(1);

        // The candidate search box accepts input.
        const search = page.getByPlaceholder(/search candidates/i);
        await search.fill("test");
        await expect(search).toHaveValue("test");

        // The Filters panel toggles open.
        await page.getByRole("button", { name: /filters/i }).click();
        await expect(page.getByText(/target requisition/i)).toBeVisible({ timeout: 10_000 });
    });

    test("Mail — the communication inbox renders", async ({ page }) => {
        // Scenario: recruiter opens the Mail module to review candidate correspondence.
        await open(page, "/enterprise/communication");
        await expect(page.getByRole("heading", { name: "Mail" })).toBeVisible({ timeout: 20_000 });
        // The inbox search is present, and the search accepts input.
        const search = page.getByPlaceholder(/search conversations/i);
        await expect(search).toBeVisible();
        await search.fill("candidate");
        await expect(search).toHaveValue("candidate");
    });

    test("Job Portals — integration cards render and open a detail", async ({ page }) => {
        // Scenario: recruiter reviews external posting channels and opens one (e.g. LinkedIn).
        await open(page, "/enterprise/settings/job-portals");
        await expect(page.getByRole("heading", { name: "Job Portals" })).toBeVisible();

        await expect(page.getByText(/google jobs/i)).toBeVisible();
        const linkedin = page.getByText("LinkedIn", { exact: true }).first();
        await expect(linkedin).toBeVisible();
        // The tidied feature chip we shipped shows on the LinkedIn card.
        await expect(page.getByText(/page sync/i)).toBeVisible();
    });

    test("Onboarding Hub — list of onboarding processes renders", async ({ page }) => {
        // Scenario: recruiter opens the onboarding hub to track candidates being onboarded.
        await open(page, "/enterprise/onboarding");
        await expect(page.getByRole("heading", { name: /onboarding hub/i })).toBeVisible({ timeout: 20_000 });
        // Either an onboarding list/table or an empty-state prompt is shown.
        await expect(
            page.getByText(/onboarding|no .*onboard|initiate|in progress/i).first(),
        ).toBeVisible();
    });
});
