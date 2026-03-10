import PlotlyChart from "./PlotlyChart";

interface EventReturnChartProps {
  priceSeries: Record<string, { dates: string[]; values: number[] }>;
  title?: string;
  height?: number;
}

const COLORS = [
  "#0f8f83",
  "#2563eb",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#65a30d",
  "#ea580c",
  "#db2777",
];

export default function EventReturnChart({
  priceSeries,
  title = "Cumulative return around the event",
  height = 350,
}: EventReturnChartProps) {
  const entries = Object.entries(priceSeries);
  if (!entries.length) return null;

  const traces = entries.map(([asset, series], index) => ({
    type: "scatter" as const,
    mode: "lines" as const,
    x: series.dates,
    y: series.values,
    name: asset,
    line: {
      color: COLORS[index % COLORS.length],
      width: 2.4,
      shape: "spline" as const,
      smoothing: 0.55,
    },
    hovertemplate: `${asset}: %{y:.2f}%<extra></extra>`,
  }));

  const referenceSeries = entries[0][1];
  const eventDate = referenceSeries.dates[Math.floor(referenceSeries.dates.length / 2)];

  return (
    <PlotlyChart
      height={height}
      data={traces}
      layout={{
        title: { text: title, font: { size: 14, color: "#24364c" } },
        yaxis: { title: { text: "Cumulative return (%)", font: { size: 11, color: "#5d7288" } } },
        xaxis: { title: { text: "Date", font: { size: 11, color: "#5d7288" } } },
        shapes: eventDate
          ? [
              {
                type: "line",
                x0: eventDate,
                x1: eventDate,
                y0: 0,
                y1: 1,
                xref: "x",
                yref: "paper",
                line: { color: "rgba(15, 23, 42, 0.35)", width: 1.2, dash: "dot" },
              },
            ]
          : undefined,
      }}
    />
  );
}
