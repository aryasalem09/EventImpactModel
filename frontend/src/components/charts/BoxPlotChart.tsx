import PlotlyChart from "./PlotlyChart";
import { eventColor } from "@/lib/utils";
import type { EventWindowMetrics } from "@/types";

interface BoxPlotChartProps {
  metrics: EventWindowMetrics[];
  groupBy?: "asset" | "event_type";
  field?: "event_day_return" | "abs_move" | "z_score";
  title?: string;
  height?: number;
}

const ASSET_COLORS = ["#0f8f83", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

export default function BoxPlotChart({
  metrics,
  groupBy = "asset",
  field = "event_day_return",
  title = "Move distribution",
  height = 350,
}: BoxPlotChartProps) {
  if (!metrics.length) return null;

  const groups = [...new Set(metrics.map((metric) => metric[groupBy]))];

  const traces = groups.map((group, index) => {
    const values = metrics
      .filter((metric) => metric[groupBy] === group)
      .map((metric) => metric[field])
      .filter((value): value is number => value !== null);

    const color = groupBy === "event_type" ? eventColor(group) : ASSET_COLORS[index % ASSET_COLORS.length];

    return {
      type: "box" as const,
      y: field === "z_score" ? values : values.map((value) => value * 100),
      name: group,
      boxmean: true as const,
      marker: { color },
      fillcolor: `${color}2a`,
      line: { color, width: 1.4 },
      hovertemplate: `${group}<br>%{y:.2f}${field === "z_score" ? "" : "%"}<extra></extra>`,
    };
  });

  return (
    <PlotlyChart
      height={height}
      data={traces}
      layout={{
        title: { text: title, font: { size: 14, color: "#24364c" } },
        yaxis: {
          title: {
            text: field === "z_score" ? "Z-score" : `${field.replace(/_/g, " ")} (%)`,
            font: { size: 11, color: "#5d7288" },
          },
          zeroline: true,
          zerolinecolor: "rgba(15, 23, 42, 0.12)",
        },
        showlegend: false,
      }}
    />
  );
}
