export function pct(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined) return "--";
  return `${(val * 100).toFixed(decimals)}%`;
}

export function num(val: number | null | undefined, decimals = 4): string {
  if (val === null || val === undefined) return "--";
  return val.toFixed(decimals);
}

export function colorBySign(val: number | null | undefined): string {
  if (val === null || val === undefined) return "text-text-tertiary";
  return val > 0 ? "text-positive" : val < 0 ? "text-negative" : "text-text-tertiary";
}

export function bgBySign(val: number | null | undefined): string {
  if (val === null || val === undefined) return "bg-surface-3";
  return val > 0 ? "bg-positive-muted" : val < 0 ? "bg-negative-muted" : "bg-surface-3";
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const EVENT_COLORS: Record<string, string> = {
  CPI: "#d97706",
  FOMC: "#0f8f83",
  NFP: "#2563eb",
  EARNINGS: "#7c3aed",
  PMI: "#0f766e",
  GDP: "#b45309",
};

export function eventColor(eventType: string): string {
  return EVENT_COLORS[eventType.toUpperCase()] || "#64748b";
}
