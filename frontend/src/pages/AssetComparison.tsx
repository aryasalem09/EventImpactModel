import { useState } from "react";
import { useAssetComparison, useEventStudy, useEventTypes } from "@/hooks/useAnalytics";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import MultiSelect from "@/components/ui/MultiSelect";
import Select from "@/components/ui/Select";
import PageHeader from "@/components/ui/PageHeader";
import HeatmapChart from "@/components/charts/HeatmapChart";
import BoxPlotChart from "@/components/charts/BoxPlotChart";
import VolComparisonChart from "@/components/charts/VolComparisonChart";
import DrawdownChart from "@/components/charts/DrawdownChart";
import { pct, colorBySign } from "@/lib/utils";

const WINDOW_OPTIONS = [
  { value: "-1,1", label: "[-1, +1]" },
  { value: "-3,3", label: "[-3, +3]" },
  { value: "-5,5", label: "[-5, +5]" },
  { value: "0,1", label: "[0, +1]" },
  { value: "0,5", label: "[0, +5]" },
];

export default function AssetComparison() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [windowValue, setWindowValue] = useState("-1,1");
  const { data: eventTypeData } = useEventTypes();

  const { data, isLoading, error, refetch } = useAssetComparison({
    event_types: selectedTypes.length ? selectedTypes : undefined,
    window: windowValue,
  });

  const { data: studyData } = useEventStudy({
    event_types: selectedTypes.length ? selectedTypes : undefined,
    window: windowValue,
  });

  if (isLoading) return <LoadingSpinner text="Comparing the asset universe..." />;
  if (error) return <ErrorState message={String(error)} onRetry={refetch} />;
  if (!data || !data.summaries.length) {
    return (
      <EmptyState
        title="No comparison data"
        message="Load events and price history before comparing asset reactions."
      />
    );
  }

  const assetCount = new Set(data.summaries.map((summary) => summary.asset)).size;
  const eventFamilyCount = new Set(data.summaries.map((summary) => summary.event_type)).size;
  const hitRates = data.summaries
    .map((summary) => summary.hit_rate)
    .filter((value): value is number => value !== null);
  const averageHitRate = hitRates.length
    ? `${(hitRates.reduce((sum, value) => sum + value, 0) / hitRates.length * 100).toFixed(0)}%`
    : "--";
  const windowLabel = WINDOW_OPTIONS.find((option) => option.value === windowValue)?.label ?? windowValue;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cross-market comparison"
        title="Compare the same catalyst across assets"
        description="Juxtapose the return profile, volatility response, and drawdown behavior of each asset so relative sensitivity stands out immediately."
        stats={[
          { label: "Assets", value: assetCount, tone: "accent" },
          { label: "Event families", value: eventFamilyCount },
          { label: "Average hit rate", value: averageHitRate, tone: "positive" },
          { label: "Window", value: windowLabel, tone: "amber" },
        ]}
      >
        <div className="filter-panel rounded-[26px] border border-border p-4">
          <p className="section-kicker">Comparison controls</p>
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
            {eventTypeData ? (
              <MultiSelect
                label="Event types"
                options={eventTypeData.event_types}
                selected={selectedTypes}
                onChange={setSelectedTypes}
              />
            ) : null}
            <Select label="Window" value={windowValue} onChange={setWindowValue} options={WINDOW_OPTIONS} />
          </div>
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average event-day return</CardTitle>
            <CardDescription>
              Mean reaction by event family and asset, useful for spotting directional leadership.
            </CardDescription>
          </CardHeader>
          <HeatmapChart cells={data.heatmap_returns} valueLabel="Return" height={330} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average volatility change</CardTitle>
            <CardDescription>
              Mean post-event volatility shift, showing where events expand or compress realized vol the most.
            </CardDescription>
          </CardHeader>
          <HeatmapChart
            cells={data.heatmap_vol}
            valueLabel="Vol delta"
            colorscale="YlOrRd"
            height={330}
          />
        </Card>
      </div>

      {studyData ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Return dispersion by asset</CardTitle>
              <CardDescription>
                Distribution view of event-day returns, grouped by asset for the active window.
              </CardDescription>
            </CardHeader>
            <BoxPlotChart
              metrics={studyData.metrics}
              groupBy="asset"
              field="event_day_return"
              title="Return distribution by asset"
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Return dispersion by event type</CardTitle>
              <CardDescription>
                Compare which event families create the widest spread of outcomes across the sample.
              </CardDescription>
            </CardHeader>
            <BoxPlotChart
              metrics={studyData.metrics}
              groupBy="event_type"
              field="event_day_return"
              title="Return distribution by event family"
            />
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Volatility response by asset</CardTitle>
            <CardDescription>
              Positive bars indicate the event raised realized volatility on average in the selected window.
            </CardDescription>
          </CardHeader>
          <VolComparisonChart summaries={data.summaries} title="Volatility change by asset" />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Median max drawdown</CardTitle>
            <CardDescription>
              Typical downside excursion inside the event window for each asset in the filtered sample.
            </CardDescription>
          </CardHeader>
          <DrawdownChart summaries={data.summaries} title="Median max drawdown by asset" />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary statistics</CardTitle>
          <CardDescription>
            All core metrics used by the comparison charts, available in one sortable-looking reference table.
          </CardDescription>
        </CardHeader>
        <div className="overflow-hidden rounded-[24px] border border-border bg-white/68">
          <div className="overflow-auto">
            <table className="data-table text-[12px]">
              <thead className="bg-white/92">
                <tr>
                  <th className="pb-3 pl-4 pr-3 pt-4 text-left">Asset</th>
                  <th className="pb-3 pr-3 pt-4 text-left">Event</th>
                  <th className="pb-3 pr-3 pt-4 text-right">Count</th>
                  <th className="pb-3 pr-3 pt-4 text-right">Mean ret</th>
                  <th className="pb-3 pr-3 pt-4 text-right">Med ret</th>
                  <th className="pb-3 pr-3 pt-4 text-right">Std</th>
                  <th className="pb-3 pr-3 pt-4 text-right">Hit rate</th>
                  <th className="pb-3 pr-3 pt-4 text-right">Mean abs move</th>
                  <th className="pb-3 pr-3 pt-4 text-right">Vol delta</th>
                  <th className="pb-3 pr-4 pt-4 text-right">Med DD</th>
                </tr>
              </thead>
              <tbody>
                {data.summaries.map((summary, index) => (
                  <tr key={`${summary.asset}-${summary.event_type}-${index}`}>
                    <td className="py-3 pl-4 pr-3 font-semibold text-text-primary">{summary.asset}</td>
                    <td className="py-3 pr-3 text-text-tertiary">{summary.event_type}</td>
                    <td className="py-3 pr-3 text-right mono text-text-secondary">{summary.count}</td>
                    <td className={`py-3 pr-3 text-right mono ${colorBySign(summary.mean_return)}`}>
                      {pct(summary.mean_return)}
                    </td>
                    <td className={`py-3 pr-3 text-right mono ${colorBySign(summary.median_return)}`}>
                      {pct(summary.median_return)}
                    </td>
                    <td className="py-3 pr-3 text-right mono text-text-secondary">{pct(summary.std_return)}</td>
                    <td className="py-3 pr-3 text-right mono text-text-secondary">
                      {summary.hit_rate !== null ? `${(summary.hit_rate * 100).toFixed(0)}%` : "--"}
                    </td>
                    <td className="py-3 pr-3 text-right mono text-text-secondary">
                      {pct(summary.mean_abs_move)}
                    </td>
                    <td className={`py-3 pr-3 text-right mono ${colorBySign(summary.mean_vol_delta)}`}>
                      {pct(summary.mean_vol_delta)}
                    </td>
                    <td className="py-3 pr-4 text-right mono text-negative">
                      {pct(summary.median_drawdown)}
                    </td>
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
