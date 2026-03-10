import PlotlyChart from "./PlotlyChart";
import type { HeatmapCell } from "@/types";

interface HeatmapChartProps {
  cells: HeatmapCell[];
  title?: string;
  valueLabel?: string;
  colorscale?: string;
  asPercent?: boolean;
  height?: number;
}

export default function HeatmapChart({
  cells,
  title,
  valueLabel = "Value",
  colorscale = "RdBu",
  asPercent = true,
  height = 350,
}: HeatmapChartProps) {
  if (!cells.length) return null;

  const assets = [...new Set(cells.map((cell) => cell.asset))];
  const eventTypes = [...new Set(cells.map((cell) => cell.event_type))];
  const lookup = new Map(cells.map((cell) => [`${cell.asset}::${cell.event_type}`, cell.value]));

  const z: (number | null)[][] = [];
  const text: string[][] = [];

  for (const asset of assets) {
    const row: (number | null)[] = [];
    const textRow: string[] = [];

    for (const eventType of eventTypes) {
      const value = lookup.get(`${asset}::${eventType}`) ?? null;
      row.push(value);
      textRow.push(
        value !== null
          ? asPercent
            ? `${(value * 100).toFixed(2)}%`
            : value.toFixed(4)
          : "--"
      );
    }

    z.push(row);
    text.push(textRow);
  }

  return (
    <PlotlyChart
      height={height}
      data={[
        {
          type: "heatmap" as const,
          x: eventTypes,
          y: assets,
          z,
          text: text as unknown as string[],
          texttemplate: "%{text}",
          textfont: { size: 11, color: "#0f172a" },
          colorscale,
          reversescale: true,
          showscale: true,
          colorbar: {
            title: { text: valueLabel, font: { size: 10, color: "#5d7288" } },
            tickfont: { size: 9, color: "#5d7288" },
            outlinewidth: 0,
          },
          hovertemplate: "%{y} | %{x}<br>" + valueLabel + ": %{text}<extra></extra>",
          xgap: 3,
          ygap: 3,
        },
      ]}
      layout={{
        title: title ? { text: title, font: { size: 13, color: "#24364c" } } : undefined,
        xaxis: { title: undefined },
        yaxis: { title: undefined, autorange: "reversed" as const },
        margin: { t: title ? 44 : 24, l: 66, r: 18, b: 34 },
      }}
    />
  );
}
