import { useState } from "react";
import { useRegimes, useEventTypes } from "@/hooks/useAnalytics";
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
import RegimeComparisonChart from "@/components/charts/RegimeComparisonChart";
import { pct, colorBySign } from "@/lib/utils";

const REGIME_OPTIONS = [
  { value: "vol_regime", label: "Volatility regime" },
  { value: "trend_regime", label: "Trend regime" },
  { value: "surprise_regime", label: "Surprise direction" },
];

const WINDOW_OPTIONS = [
  { value: "-1,1", label: "[-1, +1]" },
  { value: "-3,3", label: "[-3, +3]" },
  { value: "-5,5", label: "[-5, +5]" },
];

export default function RegimeAnalysis() {
  const [regimeType, setRegimeType] = useState("vol_regime");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [windowValue, setWindowValue] = useState("-1,1");
  const { data: eventTypeData } = useEventTypes();

  const { data, isLoading, error, refetch } = useRegimes({
    regime_type: regimeType,
    event_types: selectedTypes.length ? selectedTypes : undefined,
    window: windowValue,
  });

  if (isLoading) return <LoadingSpinner text="Segmenting reactions by regime..." />;
  if (error) return <ErrorState message={String(error)} onRetry={refetch} />;
  if (!data || !data.splits.length) {
    return (
      <EmptyState
        title="No regime data"
        message="Load event files and price history before slicing results by regime."
      />
    );
  }

  const eventTypes = [...new Set(data.splits.map((split) => split.event_type))];
  const assets = new Set(data.splits.map((split) => split.asset)).size;
  const regimeLabels = new Set(data.splits.map((split) => split.regime_label)).size;
  const regimeLabel = REGIME_OPTIONS.find((option) => option.value === regimeType)?.label ?? regimeType;
  const windowLabel = WINDOW_OPTIONS.find((option) => option.value === windowValue)?.label ?? windowValue;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Context matters"
        title="Compare reactions across market regimes"
        description="Separate event outcomes by volatility backdrop, trend state, or surprise direction to see when the same release behaves differently."
        stats={[
          { label: "Regime dimension", value: regimeLabel, tone: "accent" },
          { label: "Regime labels", value: regimeLabels },
          { label: "Assets", value: assets },
          { label: "Window", value: windowLabel, tone: "amber" },
        ]}
      >
        <div className="filter-panel rounded-[26px] border border-border p-4">
          <p className="section-kicker">Regime controls</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_180px]">
            <Select label="Dimension" value={regimeType} onChange={setRegimeType} options={REGIME_OPTIONS} />
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

      {eventTypes.map((eventType) => {
        const splits = data.splits.filter((split) => split.event_type === eventType);

        return (
          <Card key={eventType}>
            <CardHeader>
              <CardTitle>{eventType} regime comparison</CardTitle>
              <CardDescription>
                Side-by-side view of how the selected regime dimension changes average return and move size for {eventType}.
              </CardDescription>
            </CardHeader>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-border bg-white/72 p-3">
                <RegimeComparisonChart
                  splits={splits}
                  field="mean_return"
                  title="Mean return by regime"
                  height={340}
                />
              </div>
              <div className="rounded-[24px] border border-border bg-white/72 p-3">
                <RegimeComparisonChart
                  splits={splits}
                  field="mean_abs_move"
                  title="Mean absolute move by regime"
                  height={340}
                />
              </div>
            </div>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>Regime split detail</CardTitle>
          <CardDescription>
            Raw regime aggregates behind the charts, including count, return, absolute move, and volatility change.
          </CardDescription>
        </CardHeader>
        <div className="overflow-hidden rounded-[24px] border border-border bg-white/68">
          <div className="overflow-auto">
            <table className="data-table text-[12px]">
              <thead className="bg-white/92">
                <tr>
                  <th className="pb-3 pl-4 pr-3 pt-4 text-left">Regime</th>
                  <th className="pb-3 pr-3 pt-4 text-left">Label</th>
                  <th className="pb-3 pr-3 pt-4 text-left">Asset</th>
                  <th className="pb-3 pr-3 pt-4 text-left">Event</th>
                  <th className="pb-3 pr-3 pt-4 text-right">Count</th>
                  <th className="pb-3 pr-3 pt-4 text-right">Mean ret</th>
                  <th className="pb-3 pr-3 pt-4 text-right">Med ret</th>
                  <th className="pb-3 pr-3 pt-4 text-right">Mean abs move</th>
                  <th className="pb-3 pr-4 pt-4 text-right">Vol delta</th>
                </tr>
              </thead>
              <tbody>
                {data.splits.map((split, index) => (
                  <tr key={`${split.asset}-${split.event_type}-${split.regime_label}-${index}`}>
                    <td className="py-3 pl-4 pr-3 capitalize text-text-tertiary">
                      {split.regime_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 pr-3 font-semibold capitalize text-text-primary">
                      {split.regime_label.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 pr-3 text-text-primary">{split.asset}</td>
                    <td className="py-3 pr-3 text-text-tertiary">{split.event_type}</td>
                    <td className="py-3 pr-3 text-right mono text-text-secondary">{split.count}</td>
                    <td className={`py-3 pr-3 text-right mono ${colorBySign(split.mean_return)}`}>
                      {pct(split.mean_return)}
                    </td>
                    <td className={`py-3 pr-3 text-right mono ${colorBySign(split.median_return)}`}>
                      {pct(split.median_return)}
                    </td>
                    <td className="py-3 pr-3 text-right mono text-text-secondary">
                      {pct(split.mean_abs_move)}
                    </td>
                    <td className={`py-3 pr-4 text-right mono ${colorBySign(split.mean_vol_delta)}`}>
                      {pct(split.mean_vol_delta)}
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
