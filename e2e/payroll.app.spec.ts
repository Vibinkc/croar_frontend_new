import { test, expect } from "@playwright/test";
import { HAS_CREDS, NEEDS_CREDS, open, suppressTour } from "./helpers";

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  MODULE: Payroll                                                           │
 * │  Payroll Dashboard · Payroll · Salary Templates · Salary Structures ·      │
 * │  Timesheets · Leave · Taxes & Forms · Payroll Reports · Payroll Activity · │
 * │  Payroll Settings                                                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 * Several payroll pages share a tabbed layout, so we assert on a distinctive
 * on-page control rather than a single <h1>.
 */
test.describe("Payroll", () => {
    test.skip(!HAS_CREDS, NEEDS_CREDS);
    test.beforeEach(async ({ page }) => {
        await suppressTour(page);
    });

    test("Payroll Dashboard — renders and links into payroll", async ({ page }) => {
        // Scenario: finance opens the payroll overview.
        await open(page, "/enterprise/payroll/dashboard");
        await expect(page).toHaveURL(/\/payroll\/dashboard/);
        await expect(page.getByText(/go to payroll|payroll|configured|manage/i).first()).toBeVisible({
            timeout: 20_000,
        });
    });

    test("Payroll — run/cycle view renders with status filter", async ({ page }) => {
        // Scenario: finance reviews payroll runs and can start a new cycle.
        await open(page, "/enterprise/payroll");
        await expect(page.getByText(/new cycle|all statuses/i).first()).toBeVisible({ timeout: 20_000 });
    });

    test("Salary Templates — list renders with statutory filter", async ({ page }) => {
        // Scenario: finance reviews the salary templates library.
        await open(page, "/enterprise/payroll/templates");
        await expect(page.getByText(/statutory/i).first()).toBeVisible({ timeout: 20_000 });
    });

    test("Salary Structures — list renders with EPF/ESI filters", async ({ page }) => {
        // Scenario: finance reviews per-employee salary structures.
        await open(page, "/enterprise/payroll/structures");
        await expect(page).toHaveURL(/\/payroll\/structures/);
        const filter = page.getByRole("combobox").first();
        await expect(filter).toBeVisible({ timeout: 20_000 });
        await expect(filter.getByRole("option", { name: /all structures/i })).toHaveCount(1);
    });

    test("Timesheets — work calendar renders", async ({ page }) => {
        // Scenario: an approver opens the timesheet calendar.
        await open(page, "/enterprise/payroll/timesheets");
        await expect(page.getByText(/work calendar/i).first()).toBeVisible({ timeout: 20_000 });
    });

    test("Leave — pending approvals render", async ({ page }) => {
        // Scenario: a manager reviews pending leave requests.
        await open(page, "/enterprise/payroll/leave");
        await expect(page.getByText(/pending approvals/i).first()).toBeVisible({ timeout: 20_000 });
    });

    test("Taxes & Forms — TDS liabilities render", async ({ page }) => {
        // Scenario: finance reviews tax liabilities and statutory forms.
        await open(page, "/enterprise/payroll/taxes");
        await expect(page.getByText(/tds liabilities/i).first()).toBeVisible({ timeout: 20_000 });
    });

    test("Payroll Reports — salary register renders", async ({ page }) => {
        // Scenario: finance opens payroll reports.
        await open(page, "/enterprise/payroll/reports");
        await expect(page.getByText(/salary register/i).first()).toBeVisible({ timeout: 20_000 });
    });

    test("Payroll Activity — audit/activity log renders", async ({ page }) => {
        // Scenario: finance reviews the payroll activity/audit trail.
        await open(page, "/enterprise/payroll/activity");
        await expect(page).toHaveURL(/\/payroll\/activity/);
        await expect(page.getByText(/activity|log|history|no .*activity/i).first()).toBeVisible({ timeout: 20_000 });
    });

    test("Payroll Settings — settings render", async ({ page }) => {
        // Scenario: finance opens payroll configuration.
        await open(page, "/enterprise/payroll/settings");
        await expect(page.getByText(/settings/i).first()).toBeVisible({ timeout: 20_000 });
    });
});
