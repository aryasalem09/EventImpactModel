import { useEffect, useState } from "react";
import { useEventStudy, useEventDetail, useEventTypes } from "@/hooks/useAnalytics";
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
import Badge from "@/components/ui/Badge";
import EventReturnChart from "@/components/charts/EventReturnChart";
import DistributionChart from "@/components/charts/DistributionChart";
import { pct, colorBySign, num } from "@/lib/utils";

const WINDOW_OPTIONS = [
  { value: "-1,1", label: "[-1, +1]" },
  { value: "-3,3", label: "[-3, +3]" },
  { value: "-5,5", label: "[-5, +5]" },
  { value: "0,1", label: "[0, +1]" },
  { value: "0,3", label: "[0, +3]" },
  { value: "0,5", label: "[0, +5]" },
];

export default function EventExplorer() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [windowValue, setWindowValue] = useState("-1,1");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: eventTypeData } = useEventTypes();
  const { data, isLoading, error, refetch } = useEventStudy({
    event_types: selectedTypes.length ? selectedTypes : undefined,
    window: windowValue,
  });
  const { data: detailData } = useEventDetail(selectedEventId);

  if (isLoading) return <LoadingSpinner text="Running the event study engine..." />;
  if (error) return <ErrorState message={String(error)} onRetry={refetch} />;
  if (!data || !data.metrics.length) {
    return (
      <EmptyState
        title="No event study results"
        message="Load event files and price history first, then reopen Event Explorer."
      />
    );
  }

  const uniqueEvents = new Map<string, typeof data.metrics[0]>();
  for (const metric of data.metrics) {
    if (!uniqueEvents.has(metric.event_id)) {
      uniqueEvents.set(metric.event_id, metric);
    }
  }

  const eventList = [...uniqueEvents.values()].sort((a, b) => b.event_date.localeCompare(a.event_date));
  const assetCount = new Set(data.metrics.map((metric) => metric.asset)).size;
  const windowLabel = WINDOW_OPTIONS.find((option) => option.value === windowValue)?.label ?? windowValue;

  useEffect(() => {
    if (!eventList.length) {
      setSelectedEventId(null);
      return;
    }

    if (!selectedEventId || !eventList.some((event) => event.event_id === selectedEventId)) {
      setSelectedEventId(eventList[0].event_id);
    }
  }, [eventList, selectedEventId]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Drill into each catalyst"
        title="Trace the path of every release"
        description="Review individual events, compare cross-asset reactions within the same window, and inspect how returns evolved immediately around the catalyst."
        stats={[
          { label: "Unique events", value: eventList.length, tone: "accent" },
          { label: "Assets in sample", value: assetCount },
          { label: "Window", value: windowLabel, tone: "amber" },
          { label: "Filters", value: selectedTypes.length || "All" },
        ]}
      >
        <div className="filter-panel rounded-[26px] border border-border p-4">
          <p className="section-kicker">Explorer controls</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Distribution snapshot</CardTitle>
          <CardDescription>
            See how event-day returns are distributed by event family for the active filter selection.
          </CardDescription>
        </CardHeader>
        <DistributionChart
          metrics={data.metrics}
          field="event_day_return"
          groupBy="event_type"
          title="Event-day return distribution"
          height={340}
        />
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Event list</CardTitle>
            <CardDescription>
              Select any event to load its detailed return path and window metrics.
            </CardDescription>
          </CardHeader>

          <div className="overflow-hidden rounded-[24px] border border-border bg-white/68">
            <div className="max-h-[660px] overflow-auto">
              <table className="data-table text-[13px]">
                <thead className="sticky top-0 bg-white/92 backdrop-blur">
                  <tr>
                    <th className="pb-3 pl-4 pr-4 pt-4 text-left">Event</th>
                    <th className="pb-3 pr-4 pt-4 text-left">Type</th>
                    <th className="pb-3 pr-4 pt-4 text-left">Date</th>
                    <th className="pb-3 pr-4 pt-4 text-right">Surprise</th>
                  </tr>
                </thead>
                <tbody>
                  {eventList.map((event) => {
                    const isActive = selectedEventId === event.event_id;

                    return (
                      <tr
                        key={event.event_id}
                        className={isActive ? "bg-accent/8" : undefined}
                        onClick={() => setSelectedEventId(event.event_id)}
                      >
                        <td className="py-3 pl-4 pr-4">
                          <button
                            type="button"
                            className="text-left"
                            onClick={() => setSelectedEventId(event.event_id)}
                          >
                            <span className="block font-semibold text-text-primary">{event.event_name}</span>
                            <span className="mt-1 block text-[12px] text-text-tertiary">
                              Click for detail
                            </span>
                          </button>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge label={event.event_type} eventType={event.event_type} />
                        </td>
                        <td className="py-3 pr-4 text-[12px] text-text-muted mono">{event.event_date}</td>
                        <td className="py-3 pr-4 text-right text-[12px] text-text-secondary mono">
                          {event.surprise_regime || "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card className="xl:sticky xl:top-6 xl:self-start">
          <CardHeader>
            <CardTitle>
              {detailData
                ? String((detailData.event as Record<string, unknown>).event_name ?? selectedEventId)
                : "Event detail"}
            </CardTitle>
            <CardDescription>
              Normalized return path plus per-asset window metrics for the active event.
            </CardDescription>
          </CardHeader>

          {selectedEventId && detailData ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {typeof detailData.event.event_type === "string" ? (
                  <Badge
                    label={detailData.event.event_type}
                    eventType={detailData.event.event_type}
                  />
                ) : null}
                <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium text-text-tertiary">
                  {String(detailData.event.timestamp ?? "").slice(0, 10)}
                </span>
                {typeof detailData.event.surprise_regime === "string" && detailData.event.surprise_regime ? (
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium capitalize text-text-tertiary">
                    {detailData.event.surprise_regime.replace(/_/g, " ")}
                  </span>
                ) : null}
              </div>

              {Object.keys(detailData.price_series).length > 0 ? (
                <div className="rounded-[24px] border border-border bg-white/72 p-3">
                  <EventReturnChart
                    priceSeries={detailData.price_series}
                    title="Normalized returns around the event"
                    height={350}
                  />
                </div>
              ) : null}

              {detailData.metrics.length > 0 ? (
                <div className="overflow-hidden rounded-[24px] border border-border bg-white/68">
                  <div className="max-h-[420px] overflow-auto">
                    <table className="data-table text-[12px]">
                      <thead className="sticky top-0 bg-white/92 backdrop-blur">
                        <tr>
                          <th className="pb-3 pl-4 pr-3 pt-4 text-left">Asset</th>
                          <th className="pb-3 pr-3 pt-4 text-left">Window</th>
                          <th className="pb-3 pr-3 pt-4 text-right">Return</th>
                          <th className="pb-3 pr-3 pt-4 text-right">Cum ret</th>
                          <th className="pb-3 pr-3 pt-4 text-right">Vol delta</th>
                          <th className="pb-3 pr-3 pt-4 text-right">Z-score</th>
                          <th className="pb-3 pr-3 pt-4 text-right">Max DD</th>
                          <th className="pb-3 pr-4 pt-4 text-right">Pctile</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.metrics.map((metric, index) => (
                          <tr key={`${metric.asset}-${metric.window.join("-")}-${index}`}>
                            <td className="py-3 pl-4 pr-3 font-semibold text-text-primary">{metric.asset}</td>
                            <td className="py-3 pr-3 text-text-muted mono">
                              [{metric.window[0]}, {metric.window[1]}]
                            </td>
                            <td className={`py-3 pr-3 text-right mono ${colorBySign(metric.event_day_return)}`}>
                              {pct(metric.event_day_return)}
                            </td>
                            <td className={`py-3 pr-3 text-right mono ${colorBySign(metric.cumulative_return)}`}>
                              {pct(metric.cumulative_return)}
                            </td>
                            <td className={`py-3 pr-3 text-right mono ${colorBySign(metric.vol_delta)}`}>
                              {pct(metric.vol_delta)}
                            </td>
                            <td className="py-3 pr-3 text-right mono text-text-secondary">
                              {num(metric.z_score, 2)}
                            </td>
                            <td className="py-3 pr-3 text-right mono text-negative">
                              {pct(metric.max_drawdown)}
                            </td>
                            <td className="py-3 pr-4 text-right mono text-text-secondary">
                              {metric.percentile_rank?.toFixed(0) ?? "--"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title="Select an event"
              message="Choose any row from the event list to load its normalized return path and per-asset metrics."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
