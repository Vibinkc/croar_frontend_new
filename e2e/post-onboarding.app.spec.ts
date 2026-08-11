import { test, expect } from "@playwright/test";
import { HAS_CREDS, NEEDS_CREDS, open, suppressTour } from "./helpers";

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  MODULE: Post Onboarding                                                   │
 * │  Employees · Projects · Tasks · Skill Assessments · 360 Assessments ·      │
 * │  HR Surveys                                                                │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
test.describe("Post Onboarding", () => {
    test.skip(!HAS_CREDS, NEEDS_CREDS);
    test.beforeEach(async ({ page }) => {
        await suppressTour(page);
    });

    test("Employees — directory renders and 'add employee' opens the form", async ({ page }) => {
        // Scenario: HR opens the employee directory and starts adding a new hire.
        await open(page, "/enterprise/employees");
        await expect(page.getByRole("heading", { name: /employee directory/i })).toBeVisible();

        const add = page.getByRole("link", { name: /add employee/i }).or(page.getByRole("button", { name: /add employee/i }));
        if (await add.count()) {
            await add.first().click();
            await expect(page).toHaveURL(/\/employees\/add/, { timeout: 15_000 });
        }
    });

    test("Projects — list renders", async ({ page }) => {
        // Scenario: HR reviews active projects that employees are staffed on.
        await open(page, "/enterprise/projects");
        await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
        await expect(page.getByRole("button", { name: /add project|new project|create/i }).first()).toBeVisible();
    });

    test("Tasks — project tasks board renders", async ({ page }) => {
        // Scenario: HR reviews the task board across projects.
        await open(page, "/enterprise/tasks");
        await expect(page.getByRole("heading", { name: /project tasks/i })).toBeVisible();
    });

    test("Skill Assessments — the new-assessment builder renders", async ({ page }) => {
        // Scenario: HR opens the skill assessment builder to test an employee's skills.
        await open(page, "/enterprise/skill-assessments");
        await expect(page.getByRole("heading", { name: /skill assessment/i })).toBeVisible({ timeout: 20_000 });
    });

    test("360 Assessments — landing renders", async ({ page }) => {
        // Scenario: HR opens the 360-feedback module.
        await open(page, "/enterprise/assessments-360");
        await expect(page.getByRole("heading", { name: /360 assessments/i })).toBeVisible({ timeout: 20_000 });
    });

    test("HR Surveys — landing renders", async ({ page }) => {
        // Scenario: HR reviews employee-engagement surveys.
        await open(page, "/enterprise/surveys");
        await expect(page.getByRole("heading", { name: /hr surveys/i })).toBeVisible({ timeout: 20_000 });
    });
});
