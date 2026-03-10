export default function EmptyState({
  title = "No data",
  message = "Load events and refresh prices to get started.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center py-18">
      <div className="surface-card w-full max-w-lg rounded-[30px] px-6 py-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M 4 6 H 20" />
            <path d="M 4 12 H 20" />
            <path d="M 4 18 H 14" />
          </svg>
        </div>
        <p className="mt-4 font-display text-[1.2rem] font-semibold tracking-[-0.03em] text-text-primary">
          {title}
        </p>
        <p className="mt-2 text-[13px] leading-6 text-text-tertiary">{message}</p>
      </div>
    </div>
  );
}
