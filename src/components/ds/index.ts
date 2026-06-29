/**
 * Croar Design System — reusable components & tokens.
 *
 *   import { Button, Card, Input, Field, Badge, StatCard, PageHeader, PageShell, hankenGrotesk } from "@/components/ds";
 *
 * Visual language: Hanken Grotesk + JetBrains Mono, indigo #5B53E0 accent,
 * flat white surfaces with #E8EAED hairline borders, 10–14px radii, dark
 * #0E1014 surfaces for nav/hero. All components are mobile-responsive.
 */
export { cn } from "./cn";
export { ds, BRAND_GRADIENT, HERO_BG, HERO_GLOW, shadow } from "./tokens";
export { hankenGrotesk, jetbrainsMono } from "./fonts";
export { CroarMark, CroarLogo } from "./Brand";
export { Button, type ButtonProps } from "./Button";
export { Card, CardHeader, type CardProps } from "./Card";
export { Input, Textarea, Select, Field, type InputProps } from "./Input";
export { Badge, type BadgeProps } from "./Badge";
export { StatCard, StatGrid, type StatCardProps } from "./StatCard";
export { PageHeader, type PageHeaderProps } from "./PageHeader";
export { PageHelp, type PageHelpProps } from "./PageHelp";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { PageShell, HeroBand } from "./PageShell";
