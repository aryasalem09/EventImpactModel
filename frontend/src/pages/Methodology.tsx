import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

const METRIC_NOTES = [
  {
    name: "Z-score",
    description:
      "Event-day return divided by trailing realized volatility, measuring how large the move was relative to recent noise.",
  },
  {
    name: "Percentile rank",
    description:
      "Share of historical absolute daily returns that are smaller than the event-day move.",
  },
  {
    name: "Max drawdown / run-up",
    description:
      "Worst peak-to-trough decline and best trough-to-peak rise observed inside the selected window.",
  },
  {
    name: "Persistence",
    description:
      "Follow-through over +1, +3, and +5 trading days after the event to separate continuation from fade.",
  },
  {
    name: "Reversal score",
    description:
      "Simple continuation flag based on whether the next day keeps or flips the sign of the event-day move.",
  },
];

const REGIME_NOTES = [
  {
    name: "Volatility regime",
    description:
      "Current rolling realized volatility ranked against the trailing 252-day distribution. High vol is above the 75th percentile, low vol below the 25th percentile.",
  },
  {
    name: "Trend regime",
    description:
      "Bullish when price is above the 50-day average and the 50-day average is above the 200-day average; bearish when both relationships reverse.",
  },
  {
    name: "Surprise direction",
    description:
      "Derived from the surprise field in the event data. Positive, negative, or neutral when the field is missing or flat.",
  },
  {
    name: "Semantic labels",
    description:
      "Contextual naming such as hotter or cooler CPI, strong or weak NFP, and hawkish or dovish FOMC proxies based on the supplied surprise sign.",
  },
];

const LIMITATIONS = [
  "Daily data only, so intraday spike-and-reversal behavior is invisible.",
  "Event timing can blur close-to-close attribution when releases land after the market close.",
  "Sample sizes are descriptive rather than predictive, especially for infrequent event families.",
  "Surprise metrics depend entirely on the quality of the user-supplied expected and actual values.",
  "No transaction costs, slippage, or liquidity constraints are modeled in the return calculations.",
  "Regime labels are built using only historical information available up to the event date.",
];

const SCHEMA_ROWS = [
  ["event_id", "Yes", "Unique identifier for the event"],
  ["event_type", "Yes", "Category such as CPI, FOMC, NFP, or EARNINGS"],
  ["event_name", "Yes", "Human-readable label for the release"],
  ["timestamp", "Yes", "ISO datetime, for example 2024-01-12 08:30:00"],
  ["timezone", "No", "Default US/Eastern"],
  ["country", "No", "Default US"],
  ["category", "No", "Optional sub-category"],
  ["expected", "No", "Consensus expectation"],
  ["actual", "No", "Actual reported value"],
  ["surprise", "No", "Actual minus expected"],
  ["surprise_pct", "No", "Surprise as a percentage"],
  ["importance", "No", "high, medium, or low"],
  ["notes", "No", "Free-form notes"],
  ["source", "No", "Origin of the event data"],
];

export default function Methodology() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Research design"
        title="Methodology and assumptions"
        description="The platform is designed for transparent, reproducible event studies. This page documents the formulas, regime logic, and caveats that shape every metric in the dashboard."
        stats={[
          { label: "Data cadence", value: "Daily", tone: "accent" },
          { label: "Default windows", value: 6 },
          { label: "Benchmark", value: "SPY", tone: "amber" },
          { label: "Bias guard", value: "No look-ahead", tone: "positive" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Data source and handling</CardTitle>
            <CardDescription>
              Price data comes from Yahoo Finance via the yfinance library and is stored as daily OHLCV history with adjusted closes.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4 text-[13px] leading-7 text-text-secondary">
            <p>
              All analytics run on daily bars. That keeps the workflow lightweight and reproducible, but it also means the model does not try to explain intraday sequencing.
            </p>
            <ul className="space-y-3 text-text-tertiary">
              <li>Intraday reactions are not captured.</li>
              <li>Events released after the close can shift impact into the next trading day.</li>
              <li>Weekend and holiday releases map to the next available session.</li>
              <li>Event definitions are CSV-first rather than scraped, which keeps the study reproducible.</li>
            </ul>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Return and volatility formulas</CardTitle>
            <CardDescription>
              Core calculations used throughout the app for window returns, abnormal returns, and realized volatility.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4 text-[13px] text-text-secondary">
            {[
              ["Simple return", "R_t = (P_t / P_(t-1)) - 1"],
              ["Log return", "r_t = ln(P_t / P_(t-1))"],
              ["Cumulative return", "CumR = (P_end / P_start) - 1"],
              ["Volatility", "sigma = std(log_returns, window) * sqrt(252)"],
              ["Vol delta", "delta = post_vol - pre_vol"],
            ].map(([label, formula]) => (
              <div key={label} className="rounded-[22px] border border-border bg-white/72 px-4 py-4">
                <p className="section-kicker">{label}</p>
                <p className="mt-3 rounded-[16px] bg-surface-2 px-3 py-3 text-[12px] text-text-primary mono">
                  {formula}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event metrics</CardTitle>
            <CardDescription>
              Additional diagnostics used to describe the quality and persistence of an event move.
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            {METRIC_NOTES.map((item) => (
              <div key={item.name} className="rounded-[22px] border border-border bg-white/72 px-4 py-4">
                <p className="font-display text-[1.05rem] font-semibold tracking-[-0.03em] text-text-primary">
                  {item.name}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-text-tertiary">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regime classification</CardTitle>
            <CardDescription>
              Context layers used to split the same event family into meaningfully different market backdrops.
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            {REGIME_NOTES.map((item) => (
              <div key={item.name} className="rounded-[22px] border border-border bg-white/72 px-4 py-4">
                <p className="font-display text-[1.05rem] font-semibold tracking-[-0.03em] text-text-primary">
                  {item.name}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-text-tertiary">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Caveats and limitations</CardTitle>
          <CardDescription>
            Important framing for interpreting the results responsibly when you share the project or use the outputs.
          </CardDescription>
        </CardHeader>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {LIMITATIONS.map((item) => (
            <div key={item} className="rounded-[22px] border border-border bg-white/72 px-4 py-4 text-[13px] leading-6 text-text-tertiary">
              {item}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event CSV schema</CardTitle>
          <CardDescription>
            Required and optional fields for seeding your own event dataset into the application.
          </CardDescription>
        </CardHeader>

        <div className="overflow-hidden rounded-[24px] border border-border bg-white/68">
          <div className="overflow-auto">
            <table className="data-table text-[12px]">
              <thead className="bg-white/92">
                <tr>
                  <th className="pb-3 pl-4 pr-4 pt-4 text-left">Field</th>
                  <th className="pb-3 pr-4 pt-4 text-left">Required</th>
                  <th className="pb-3 pr-4 pt-4 text-left">Description</th>
                </tr>
              </thead>
              <tbody className="text-text-tertiary">
                {SCHEMA_ROWS.map(([field, required, description]) => (
                  <tr key={field}>
                    <td className="py-3 pl-4 pr-4 text-text-secondary mono">{field}</td>
                    <td className="py-3 pr-4">{required}</td>
                    <td className="py-3 pr-4">{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
