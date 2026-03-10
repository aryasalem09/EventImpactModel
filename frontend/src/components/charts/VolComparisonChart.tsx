import PlotlyChart from "./PlotlyChart";
import type { AssetEventSummary } from "@/types";

interface VolComparisonChartProps {
  summaries: AssetEventSummary[];
  eventType?: string;
  title?: string;
  height?: number;
}

function aggregateByAsset(summaries: AssetEventSummary[]) {
  const aggregates = new Map<string, { total: number; count: number }>();

  for (const summary of summaries) {
    const existing = aggregates.get(summary.asset) ?? { total: 0, count: 0 };
    if (summary.mean_vol_delta !== null) {
      existing.total += summary.mean_vol_delta;
      existing.count += 1;
    }
    aggregates.set(summary.asset, existing);
  }

  return [...aggregates.entries()].map(([asset, values]) => ({
    asset,
    value: values.count ? values.total / values.count : 0,
  }));
}

export default function VolComparisonChart({
  summaries,
  eventType,
  title = "Volatility change by asset",
  height = 350,
}: VolComparisonChartProps) {
  const filtered = eventType
    ? summaries.filter((summary) => summary.event_type === eventType)
    : summaries;

  if (!filtered.length) return null;

  const aggregated = aggregateByAsset(filtered).sort((left, right) => right.value - left.value);

  return (
    <PlotlyChart
      height={height}
      data={[
        {
          type: "bar" as const,
          x: aggregated.map((item) => item.asset),
          y: aggregated.map((item) => item.value * 100),
          marker: {
            color: aggregated.map((item) => (item.value > 0 ? "#dc2626" : "#0f8f83")),
            line: { color: "rgba(255,255,255,0.85)", width: 1 },
          },
          hovertemplate: "%{x}: %{y:.2f}%<extra></extra>",
        },
      ]}
      layout={{
        title: { text: title, font: { size: 14, color: "#24364c" } },
        yaxis: {
          title: { text: "Average vol delta (%)", font: { size: 11, color: "#5d7288" } },
          zeroline: true,
          zerolinecolor: "rgba(15, 23, 42, 0.12)",
        },
      }}
    />
  );
}
