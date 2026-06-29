/** A single coach-mark step in the product tour. */
export interface TourStep {
    /** CSS selector of the element to spotlight. Omit for a centered, target-less step. */
    selector?: string;
    title: string;
    body: string;
    /** Preferred side for the tooltip relative to the target. "auto" picks the best fit. */
    placement?: "auto" | "right" | "bottom" | "left" | "top" | "center";
}

/**
 * The first-run orientation tour. Targets are anchored to real nav elements via
 * `data-tour="…"` attributes in the enterprise layout, so the spotlight tracks the
 * actual UI. Keep this short — orientation, not a manual.
 */
export const TOUR_STEPS: TourStep[] = [
    {
        title: "Welcome to Croar 👋",
        body: "Here's a 30-second tour of how to get around. You can replay it anytime from the Help button in the bottom-right corner.",
        placement: "center",
    },
    {
        selector: '[data-tour="nav"]',
        title: "Your navigation",
        body: "Everything lives here, grouped by area — Recruit, People, Payroll and Admin. Click a group to expand its pages; the page you're on is highlighted.",
        placement: "right",
    },
    {
        selector: '[data-tour="search"]',
        title: "Jump anywhere instantly",
        body: "Press ⌘K (Ctrl + K on Windows) to search every page and action. It's the fastest way to move around without hunting through menus.",
        placement: "right",
    },
    {
        selector: '[data-tour="page-help"]',
        title: "Not sure what a page does?",
        body: "Every page has this info icon next to its title. Click it anytime for a quick explainer of what the page is for and what you can do there.",
        placement: "bottom",
    },
    {
        selector: '[data-tour="help"]',
        title: "Help is always one click away",
        body: "Stuck? Open Help for a Getting-Started checklist, keyboard shortcuts, replay this tour — and “Browse the full guide”, a detailed walkthrough of every module and workflow in Croar.",
        placement: "left",
    },
];
