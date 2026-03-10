import { cn, eventColor } from "@/lib/utils";

export default function Badge({
  label,
  color,
  eventType,
}: {
  label: string;
  color?: string;
  eventType?: string;
}) {
  const bg = eventType ? eventColor(eventType) : color || "#71717a";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
      )}
      style={{
        background: `linear-gradient(135deg, ${bg}14, ${bg}08)`,
        color: bg,
        borderColor: `${bg}2d`,
      }}
    >
      {label}
    </span>
  );
}
