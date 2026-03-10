import { cn } from "@/lib/utils";

interface SelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  className,
}: SelectProps) {
  return (
    <div className={cn("flex min-w-[170px] flex-col gap-2", className)}>
      {label ? (
        <label className="text-[10px] font-semibold uppercase tracking-[0.26em] text-text-muted">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="filter-panel w-full appearance-none rounded-[18px] border border-border px-4 py-3 pr-11 text-[13px] font-medium text-text-primary focus:border-accent/30 focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M 6 9 L 12 15 L 18 9" />
          </svg>
        </span>
      </div>
    </div>
  );
}
