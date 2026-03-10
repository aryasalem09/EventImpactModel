import { cn } from "@/lib/utils";

interface MultiSelectProps {
  label?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  className,
}: MultiSelectProps) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
      return;
    }

    onChange([...selected, option]);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-3">
          <label className="text-[10px] font-semibold uppercase tracking-[0.26em] text-text-muted">
            {label}
          </label>
          <span className="text-[11px] font-medium text-text-tertiary">
            {selected.length ? `${selected.length} selected` : "All"}
          </span>
        </div>
      ) : null}

      <div className="filter-panel flex flex-wrap gap-2 rounded-[22px] border border-border p-2.5">
        {options.map((option) => {
          const isSelected = selected.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-[12px] font-semibold tracking-[0.08em]",
                isSelected
                  ? "border-accent/25 bg-accent/12 text-accent-strong shadow-[0_10px_22px_-18px_rgba(15,143,131,0.9)]"
                  : "border-transparent bg-white/70 text-text-secondary hover:border-border hover:bg-white"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
