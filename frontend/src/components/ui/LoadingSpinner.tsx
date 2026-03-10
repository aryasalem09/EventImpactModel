import { cn } from "@/lib/utils";

export default function LoadingSpinner({
  text = "Loading...",
  fullScreen = false,
}: {
  text?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "min-h-screen px-4" : "py-24"
      )}
    >
      <div className="surface-card w-full max-w-sm rounded-[28px] px-6 py-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent [animation-delay:-0.24s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent [animation-delay:-0.12s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent" />
          </div>
        </div>
        <p className="mt-5 font-display text-[1.1rem] font-semibold tracking-[-0.03em] text-text-primary">
          Working on it
        </p>
        <p className="mt-2 text-[13px] leading-6 text-text-tertiary">{text}</p>
      </div>
    </div>
  );
}
