import PlotlyChart from "./PlotlyChart";
import type { RegimeSplit } from "@/types";

interface RegimeComparisonChartProps {
  splits: RegimeSplit[];
  field?: "mean_return" | "mean_abs_move" | "mean_vol_delta";
  title?: string;
  height?: number;
}

const REGIME_COLORS: Record<string, string> = {
  high_vol: "#dc2626",
  normal_vol: "#d97706",
  low_vol: "#0f8f83",
  bullish: "#15803d",
  bearish: "#dc2626",
  neutral: "#64748b",
  positive_surprise: "#0f8f83",
  negative_surprise: "#dc2626",
};

export default function RegimeComparisonChart({
  splits,
  field = "mean_return",
  title = "Regime comparison",
  height = 400,
}: RegimeComparisonChartProps) {
  if (!splits.length) return null;

  const regimeLabels = [...new Set(splits.map((split) => split.regime_label))];
  const assets = [...new Set(splits.map((split) => split.asset))];

  const traces = regimeLabels.map((label) => {
    const values = assets.map((asset) => {
      const split = splits.find((candidate) => candidate.regime_label === label && candidate.asset === asset);
      return split ? (split[field] ?? 0) * 100 : 0;
    });

    return {
      type: "bar" as const,
      x: assets,
      y: values,
      name: label.replace(/_/g, " "),
      marker: {
        color: REGIME_COLORS[label] || "#64748b",
        line: { width: 0 },
      },
      hovertemplate: "%{x}<br>%{y:.2f}%<extra></extra>",
    };
  });

  return (
    <PlotlyChart
      height={height}
      data={traces}
      layout={{
        title: { text: title, font: { size: 13, color: "#24364c" } },
        barmode: "group" as const,
        bargap: 0.22,
        bargroupgap: 0.08,
        yaxis: {
          title: {
            text: `${field.replace(/_/g, " ")} (%)`,
            font: { size: 10, color: "#5d7288" },
          },
        },
      }}
    />
  );
}
