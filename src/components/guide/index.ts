/**
 * Croar Guide — the in-app onboarding system.
 *
 *   <GuideProvider>   …app…   <Tour /> <HelpButton />   </GuideProvider>
 *
 * - First-login interactive tour (coach-marks over the real nav).
 * - Persistent Help launcher with a Getting-Started checklist + shortcuts.
 * - Re-playable anytime. All state persists in localStorage.
 *
 * Page-level "?" help lives in the design system: import { PageHelp } from "@/components/ds".
 */
export { GuideProvider, useGuide } from "./GuideProvider";
export { Tour } from "./Tour";
export { HelpButton } from "./HelpButton";
export { GuideBook } from "./GuideBook";
export { TOUR_STEPS, type TourStep } from "./tourSteps";
export { GUIDE_TOPICS, type GuideTopic } from "./guideContent";
