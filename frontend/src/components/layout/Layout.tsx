import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const PAGE_LABELS: Record<string, string> = {
  "/": "Market Overview",
  "/events": "Event Explorer",
  "/comparison": "Asset Comparison",
  "/regimes": "Regime Analysis",
  "/data": "Data Operations",
  "/methodology": "Methodology",
};

export default function Layout() {
  const location = useLocation();
  const pageLabel = PAGE_LABELS[location.pathname] ?? "Event Impact Model";

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-4 px-3 py-3 sm:px-5 lg:flex-row lg:gap-6 lg:px-6 lg:py-6">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-4 rounded-[28px] border border-border bg-white/64 px-4 py-4 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.48)] backdrop-blur-xl sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="section-kicker">Research workspace</p>
              <p className="mt-1 font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-text-primary sm:text-[1.9rem]">
                {pageLabel}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="status-pill">FastAPI + React</span>
              <span className="status-pill">CSV event source</span>
              <span className="status-pill">Daily market bars</span>
            </div>
          </div>

          <div className="surface-card rounded-[34px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
