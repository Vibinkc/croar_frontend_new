import { moneyParts } from "@/utils/payroll/api";

/**
 * Render a money amount with the currency symbol scaled down relative to the
 * digits. Wide/heavy glyphs (₩, ¥, €) render oversized in display/mono fonts and
 * visually overpower the number when drawn at full size; here the symbol sits at
 * ~0.68em and normal weight so the digits stay the focal point.
 *
 * Use this for large numeric displays (stat cards, payslip totals). For plain
 * strings (dialogs, table cells, CSV) keep using `inr()`.
 */
export function Money({
  value,
  currency = "INR",
  className,
  symbolClassName,
}: {
  value: number | string | null | undefined;
  currency?: string;
  className?: string;
  symbolClassName?: string;
}) {
  const { symbol, amount, isGlyph } = moneyParts(value, currency);
  return (
    <span className={className}>
      <span
        className={symbolClassName}
        style={{
          fontSize: isGlyph ? "0.68em" : "0.72em",
          fontWeight: 500,
          marginRight: "0.14em",
          verticalAlign: "baseline",
          opacity: 0.9,
        }}
      >
        {symbol}
      </span>
      {amount}
    </span>
  );
}
