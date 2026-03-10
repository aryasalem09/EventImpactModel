import { cn } from "@/lib/utils";

export interface HeaderStat {
  label: string;
  value: string | number;
  tone?: "default" | "accent" | "positive" | "amber";
}

const TONE_CLASSES: Record<NonNullable<HeaderStat["tone"]>, string> = {
  default: "border-white/60 bg-white/68 text-text-secondary",
  accent: "border-accent/18 bg-accent/10 text-accent-strong",
  positive: "border-positive/18 bg-positive/10 text-positive",
  amber: "border-amber/18 bg-amber/10 text-amber",
};

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  stats?: HeaderStat[];
  children?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  stats = [],
  children,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[30px] border border-border bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,248,251,0.9))] px-5 py-6 shadow-[0_30px_80px_-52px_rgba(15,23,42,0.55)] sm:px-7 sm:py-7",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(15,143,131,0.26),transparent)]" />
      <div className="absolute -right-20 top-[-72px] h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -left-10 bottom-[-76px] h-44 w-44 rounded-full bg-amber/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-text-muted sm:text-[11px]">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-display text-[2rem] font-semibold tracking-[-0.04em] text-text-primary sm:text-[2.55rem]">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-text-tertiary sm:text-[15px]">
              {description}
            </p>
          </div>

          {children ? (
            <div className="w-full xl:max-w-lg">
              {children}
            </div>
          ) : null}
        </div>

        {stats.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-[22px] border px-4 py-4 backdrop-blur-sm",
                  TONE_CLASSES[stat.tone ?? "default"]
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-current/70">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-[1.6rem] font-semibold tracking-[-0.04em] text-current">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
