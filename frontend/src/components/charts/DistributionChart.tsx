import PlotlyChart from "./PlotlyChart";
import { eventColor } from "@/lib/utils";
import type { EventWindowMetrics } from "@/types";

interface DistributionChartProps {
  metrics: EventWindowMetrics[];
  field?: "event_day_return" | "abs_move" | "z_score";
  groupBy?: "event_type" | "asset";
  title?: string;
  height?: number;
}

export default function DistributionChart({
  metrics,
  field = "event_day_return",
  groupBy = "event_type",
  title = "Return distribution",
  height = 350,
}: DistributionChartProps) {
  if (!metrics.length) return null;

  const groups = [...new Set(metrics.map((metric) => metric[groupBy]))];

  const traces = groups.map((group) => {
    const values = metrics
      .filter((metric) => metric[groupBy] === group)
      .map((metric) => metric[field])
      .filter((value): value is number => value !== null);

    return {
      type: "histogram" as const,
      x: field === "z_score" ? values : values.map((value) => value * 100),
      name: group,
      opacity: 0.62,
      nbinsx: 24,
      marker: {
        color: groupBy === "event_type" ? eventColor(group) : "#0f8f83",
        line: { color: "rgba(255,255,255,0.85)", width: 1 },
      },
      hovertemplate: `${group}<br>%{x:.2f}${field === "z_score" ? "" : "%"}<extra></extra>`,
    };
  });

  return (
    <PlotlyChart
      height={height}
      data={traces}
      layout={{
        title: { text: title, font: { size: 14, color: "#24364c" } },
        barmode: "overlay" as const,
        bargap: 0.08,
        xaxis: {
          title: {
            text: field === "z_score" ? "Z-score" : `${field.replace(/_/g, " ")} (%)`,
            font: { size: 11, color: "#5d7288" },
          },
        },
        yaxis: { title: { text: "Count", font: { size: 11, color: "#5d7288" } } },
      }}
    />
  );
}
