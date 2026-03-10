import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Overview", icon: "chart", note: "Live dashboard" },
  { to: "/events", label: "Event Explorer", icon: "calendar", note: "Inspect each release" },
  { to: "/comparison", label: "Asset Comparison", icon: "layers", note: "Cross-market reactions" },
  { to: "/regimes", label: "Regime Analysis", icon: "split", note: "Segment by context" },
  { to: "/data", label: "Data Manager", icon: "database", note: "Reload and refresh" },
  { to: "/methodology", label: "Methodology", icon: "book", note: "Assumptions and caveats" },
];

const icons: Record<string, string> = {
  chart: "M 3 17 L 9 11 L 13 15 L 21 7",
  calendar: "M 3 6 H 21 V 20 H 3 Z M 7 3 V 6 M 17 3 V 6 M 3 10 H 21",
  layers: "M 12 2 L 2 7 L 12 12 L 22 7 Z M 2 12 L 12 17 L 22 12",
  split: "M 6 3 V 21 M 18 3 V 21 M 6 12 H 18",
  database:
    "M 12 3 C 7 3 3 5 3 6 V 18 C 3 19 7 21 12 21 C 17 21 21 19 21 18 V 6 C 21 5 17 3 12 3 Z",
  book: "M 4 4 H 10 V 20 H 4 Z M 10 4 H 20 V 20 H 10 Z",
};

function Icon({ name }: { name: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={icons[name] || icons.chart} />
    </svg>
  );
}

function BrandBlock() {
  return (
    <div className="rounded-[28px] border border-sidebar-border bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_22px_52px_-40px_rgba(0,0,0,0.85)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/10 ring-1 ring-white/12">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#79e6d8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 3 17 L 9 11 L 13 15 L 21 7" />
            <path d="M 17 7 H 21 V 11" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/55">
            Analytics Desk
          </p>
          <h1 className="mt-2 font-display text-[1.55rem] font-semibold tracking-[-0.05em] text-white">
            Event Impact Model
          </h1>
          <p className="mt-2 max-w-[15rem] text-[13px] leading-6 text-slate-300">
            Study how macro releases and scheduled market events ripple across asset classes.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-slate-200/85">
        <div className="rounded-2xl bg-white/6 px-3 py-3">
          <p className="uppercase tracking-[0.2em] text-slate-400">Inputs</p>
          <p className="mt-1 font-semibold text-white">CSV + Yahoo Finance</p>
        </div>
        <div className="rounded-2xl bg-white/6 px-3 py-3">
          <p className="uppercase tracking-[0.2em] text-slate-400">Engine</p>
          <p className="mt-1 font-semibold text-white">FastAPI analytics</p>
        </div>
      </div>
    </div>
  );
}

function NavList({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav className={cn("space-y-2", mobile && "flex gap-2 overflow-x-auto pb-1")}>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            cn(
              "group flex min-w-fit items-center gap-3 rounded-[22px] border px-3.5 py-3.5 text-left",
              mobile
                ? "w-auto shrink-0 whitespace-nowrap"
                : "w-full",
              isActive
                ? "border-white/22 bg-white/12 text-white shadow-[0_16px_30px_-24px_rgba(15,143,131,0.75)]"
                : "border-transparent bg-white/[0.02] text-slate-300 hover:border-white/8 hover:bg-white/6 hover:text-white"
            )
          }
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-white/8 text-current">
            <Icon name={item.icon} />
          </div>
          <div className={cn("min-w-0", mobile && "pr-1")}>
            <p className="text-[13px] font-semibold tracking-tight">{item.label}</p>
            {!mobile ? (
              <p className="mt-1 text-[11px] text-slate-400 transition-colors group-hover:text-slate-300">
                {item.note}
              </p>
            ) : null}
          </div>
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  return (
    <>
      <div className="lg:hidden">
        <div className="rounded-[30px] bg-sidebar px-4 py-4 text-white shadow-[0_26px_60px_-42px_rgba(15,23,42,0.8)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Event Impact Model
          </p>
          <p className="mt-2 font-display text-[1.5rem] font-semibold tracking-[-0.05em]">
            Macro reaction workspace
          </p>
          <p className="mt-2 text-[13px] leading-6 text-slate-300">
            Explore event windows, compare assets, and verify the methodology behind each metric.
          </p>
          <div className="mt-4">
            <NavList mobile />
          </div>
        </div>
      </div>

      <aside className="hidden w-[320px] shrink-0 lg:block">
        <div className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col rounded-[34px] bg-sidebar px-4 py-4 text-white shadow-[0_34px_90px_-56px_rgba(15,23,42,0.92)]">
          <BrandBlock />

          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <NavList />
          </div>

          <div className="mt-4 rounded-[26px] border border-white/10 bg-white/[0.04] px-4 py-4 text-[12px] text-slate-300">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Publish Ready
            </p>
            <p className="mt-2 leading-6">
              Demo datasets, event windows, and methodology notes are all bundled for a clean repository handoff.
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-[11px] text-slate-400">
              <span>Version 1.0.0</span>
              <span>Local build</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
