import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("surface-card rounded-[28px] p-5 sm:p-6", className)}>
      {children}
    </section>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mb-5", className)}>{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-[1.15rem] font-semibold tracking-[-0.035em] text-text-primary">
      {children}
    </h3>
  );
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[13px] leading-6 text-text-tertiary">{children}</p>;
}

export function StatCard({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn("stat-card rounded-[24px] px-4 pb-4 pt-6 sm:px-5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-text-muted">
        {label}
      </p>
      <p className="mt-3 font-display text-[2rem] font-semibold tracking-[-0.05em] text-text-primary sm:text-[2.2rem]">
        {value}
      </p>
      {sub ? <p className="mt-1 text-[12px] leading-5 text-text-tertiary">{sub}</p> : null}
    </div>
  );
}
