# End-to-end tests (Playwright)

Auth-flow browser tests for the recruiter portal.

## Run

```bash
# From frontend/
npm run test:e2e            # run the auth tests (against production by default)
npm run test:e2e:ui        # interactive UI mode
npm run test:e2e:report    # open the last HTML report
```

Target another environment with `BASE_URL`:

```bash
BASE_URL=http://localhost:3000 npm run test:e2e
```

## The tests (`e2e/auth.spec.ts` — one "Auth" group)

1. login page renders the form
2. logged-out user is redirected to login from a protected page
3. rejects invalid credentials and stays on login
4. valid login lands on the dashboard
5. session persists across navigation and reload
6. logout returns to login and re-protects pages

Tests 4–6 do a **real login** and only run when a test account is provided:

```bash
# put creds in a local, git-ignored file:
cp .env.test.example .env.test      # then set TEST_EMAIL / TEST_PASSWORD
npm run test:e2e
```

Without `.env.test`, tests 4–6 are skipped.

First-time machine setup: `npx playwright install chromium`.

## Module scenario suites (`*.app.spec.ts`)

One suite per sidebar module, each with a detailed, per-page scenario (land on the page,
prove it rendered, exercise a real interaction — search / filter / open a form):

- `hiring-hub.app.spec.ts` — Dashboard · Croar Pilot · Jobs · Pipeline · Mail · Job Portals · Onboarding Hub
- `talent-search.app.spec.ts` — Candidate Bank · Profile Sourcing · Shortlisted Talent
- `automation.app.spec.ts` — Canvas · Mail · Assessment · Interview · Onboarding
- `post-onboarding.app.spec.ts` — Employees · Projects · Tasks · Skill Assessments · 360 Assessments · HR Surveys
- `payroll.app.spec.ts` — Dashboard · Payroll · Salary Templates · Salary Structures · Timesheets · Leave · Taxes & Forms · Reports · Activity · Settings
- `settings.app.spec.ts` — General · Team · Permissions · Templates

These reuse a **single logged-in session**: the `setup` project (`auth.setup.ts`) logs in once and
saves the session to `.auth/user.json`, which every `*.app.spec.ts` loads via `storageState`
(configured in `playwright.config.ts`). They require `.env.test` creds and are skipped without them.

```bash
npm run test:e2e -- --project=app               # all module suites
npm run test:e2e -- hiring-hub.app.spec.ts      # one module
npm run test:e2e -- payroll.app.spec.ts:50      # one scenario (by line)
```

Projects: `setup` (login → save session) · `authflow` (raw login/logout, no saved session) ·
`flows` (the full Croar Pilot flow) · `app` (the module suites).
