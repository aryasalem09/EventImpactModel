export default function ErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-18">
      <div className="surface-card w-full max-w-xl rounded-[30px] px-6 py-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-negative/10 text-negative">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M 12 8 V 13" />
            <path d="M 12 17.2 H 12.01" />
            <path d="M 10.3 3.8 L 2.7 17 C 2.1 18 2.8 19.2 4 19.2 H 20 C 21.2 19.2 21.9 18 21.3 17 L 13.7 3.8 C 13.1 2.8 11 2.8 10.3 3.8 Z" />
          </svg>
        </div>
        <p className="mt-4 font-display text-[1.2rem] font-semibold tracking-[-0.03em] text-text-primary">
          Analytics request failed
        </p>
        <p className="mt-2 text-[13px] leading-6 text-text-tertiary">{message}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="action-button action-button--secondary mt-5">
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}
