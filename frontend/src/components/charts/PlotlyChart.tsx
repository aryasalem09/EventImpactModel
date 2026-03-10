import { Suspense, lazy } from "react";
import type { Data, Layout } from "plotly.js";

const Plot = lazy(() => import("./PlotlyClient"));

const BASE_LAYOUT: Partial<Layout> = {
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: {
    color: "#5d7288",
    family: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    size: 12,
  },
  margin: { t: 32, r: 18, b: 42, l: 52 },
  xaxis: {
    gridcolor: "rgba(15, 23, 42, 0.08)",
    zerolinecolor: "rgba(15, 23, 42, 0.1)",
    linecolor: "rgba(15, 23, 42, 0.1)",
    tickfont: { color: "#5d7288", size: 11 },
  },
  yaxis: {
    gridcolor: "rgba(15, 23, 42, 0.08)",
    zerolinecolor: "rgba(15, 23, 42, 0.1)",
    linecolor: "rgba(15, 23, 42, 0.1)",
    tickfont: { color: "#5d7288", size: 11 },
  },
  legend: {
    font: { color: "#3c5066", size: 11 },
    bgcolor: "rgba(255, 255, 255, 0.7)",
    bordercolor: "rgba(15, 23, 42, 0.08)",
    borderwidth: 1,
    orientation: "h",
    yanchor: "bottom",
    y: 1.02,
    xanchor: "left",
    x: 0,
  },
  modebar: {
    bgcolor: "rgba(255,255,255,0.85)",
    color: "#64748b",
    activecolor: "#0f8f83",
  },
};

interface PlotlyChartProps {
  data: Data[];
  layout?: Partial<Layout>;
  height?: number;
  className?: string;
}

function ChartFallback({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-[24px] border border-border bg-white/70"
      style={{ height }}
    >
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-surface-3 border-t-accent" />
        <p className="mt-3 text-[12px] font-medium text-text-tertiary">Preparing chart...</p>
      </div>
    </div>
  );
}

export default function PlotlyChart({
  data,
  layout,
  height = 350,
  className,
}: PlotlyChartProps) {
  const merged: Partial<Layout> = {
    ...BASE_LAYOUT,
    height,
    ...layout,
    xaxis: { ...BASE_LAYOUT.xaxis, ...(layout?.xaxis as object) },
    yaxis: { ...BASE_LAYOUT.yaxis, ...(layout?.yaxis as object) },
    legend: { ...BASE_LAYOUT.legend, ...(layout?.legend as object) },
  };

  return (
    <div className={className}>
      <Suspense fallback={<ChartFallback height={height} />}>
        <Plot
          data={data}
          layout={merged}
          config={{
            displayModeBar: true,
            displaylogo: false,
            responsive: true,
            scrollZoom: false,
            modeBarButtonsToRemove: ["lasso2d", "select2d"],
          }}
          useResizeHandler
          style={{ width: "100%", height }}
        />
      </Suspense>
    </div>
  );
}
