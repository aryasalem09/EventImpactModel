import { useState } from "react";
import { useSummary, useEventTypes } from "@/hooks/useAnalytics";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  StatCard,
} from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import MultiSelect from "@/components/ui/MultiSelect";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import HeatmapChart from "@/components/charts/HeatmapChart";
import { pct, colorBySign } from "@/lib/utils";

export default function Overview() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const { data: eventTypeData } = useEventTypes();
  const { data, isLoading, error, refetch } = useSummary({
    event_types: selectedTypes.length ? selectedTypes : undefined,
  });

  if (isLoading) return <LoadingSpinner text="Computing cross-asset summary metrics..." />;
  if (error) return <ErrorState message={String(error)} onRetry={refetch} />;
  if (!data || data.total_events === 0) {
    return (
      <EmptyState
        title="No event data is loaded yet"
        message="Use Data Manager to load event files and refresh market prices before opening the dashboard."
      />
    );
  }

  const dateRange =
    data.date_range.length === 2 ? `${data.date_range[0]} to ${data.date_range[1]}` : "Not available";
  const topMover = data.top_movers[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cross-asset signal map"
        title="See where event risk lands first"
        description="This overview highlights how scheduled catalysts shape average returns, volatility shifts, and standout reactions across the tracked asset universe."
        stats={[
          { label: "Event sample", value: data.total_events, tone: "accent" },
          { label: "Assets tracked", value: data.total_assets },
          { label: "Event families", value: data.event_types.length },
          { label: "History span", value: data.date_range.length === 2 ? `${data.date_range[0].slice(0, 4)}-${data.date_range[1].slice(0, 4)}` : "--", tone: "amber" },
        ]}
      >
        {eventTypeData ? (
          <div className="filter-panel rounded-[26px] border border-border p-4">
            <p className="section-kicker">Event lens</p>
            <p className="mt-2 text-[13px] leading-6 text-text-tertiary">
              Tighten the summary to a specific catalyst family, or leave everything on to scan the full market backdrop.
            </p>
            <div className="mt-4">
              <MultiSelect
                options={eventTypeData.event_types}
                selected={selectedTypes}
                onChange={setSelectedTypes}
              />
            </div>
          </div>
        ) : null}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Events" value={data.total_events} sub="Rows after the current filter is applied." />
        <StatCard label="Assets" value={data.total_assets} sub="Configured instruments with available event metrics." />
        <StatCard
          label="Event Types"
          value={selectedTypes.length || data.event_types.length}
          sub={selectedTypes.length ? "Focused selection" : "Full event universe"}
        />
        <StatCard
          label="Date Range"
          value={data.date_range.length === 2 ? `${data.date_range[0].slice(0, 4)}-${data.date_range[1].slice(0, 4)}` : "--"}
          sub={dateRange}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average event-day return</CardTitle>
            <CardDescription>
              Mean close-to-close reaction on the event date, grouped by event family and asset.
            </CardDescription>
          </CardHeader>
          <HeatmapChart
            cells={data.heatmap_returns}
            valueLabel="Average return"
            colorscale="RdBu"
            asPercent
            height={330}
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average volatility change</CardTitle>
            <CardDescription>
              Post-event realized volatility minus pre-event volatility for the selected sample.
            </CardDescription>
          </CardHeader>
          <HeatmapChart
            cells={data.heatmap_vol}
            valueLabel="Vol delta"
            colorscale="YlOrRd"
            asPercent
            height={330}
          />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Top movers</CardTitle>
            <CardDescription>
              Ranked by absolute event-day move so the sharpest reactions are easy to review.
            </CardDescription>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="data-table text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4 text-left">Event</th>
                  <th className="pb-3 pr-4 text-left">Type</th>
                  <th className="pb-3 pr-4 text-left">Date</th>
                  <th className="pb-3 pr-4 text-left">Asset</th>
                  <th className="pb-3 pr-4 text-right">Return</th>
                  <th className="pb-3 pr-4 text-right">Abs move</th>
                  <th className="pb-3 text-right">Z-score</th>
                </tr>
              </thead>
              <tbody>
                {data.top_movers.map((mover) => (
                  <tr key={`${mover.event_id}-${mover.asset}`}>
                    <td className="py-3 pr-4 text-text-secondary">{mover.event_name}</td>
                    <td className="py-3 pr-4">
                      <Badge label={mover.event_type} eventType={mover.event_type} />
                    </td>
                    <td className="py-3 pr-4 text-[12px] text-text-muted mono">{mover.event_date}</td>
                    <td className="py-3 pr-4 font-semibold text-text-primary">{mover.asset}</td>
                    <td className={`py-3 pr-4 text-right mono ${colorBySign(mover.event_day_return)}`}>
                      {pct(mover.event_day_return)}
                    </td>
                    <td className="py-3 pr-4 text-right mono text-text-secondary">{pct(mover.abs_move)}</td>
                    <td className="py-3 text-right mono text-text-secondary">
                      {mover.z_score?.toFixed(2) ?? "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current read</CardTitle>
              <CardDescription>
                The strongest move in the current sample gives a quick feel for what is dominating the tape.
              </CardDescription>
            </CardHeader>

            {topMover ? (
              <div className="rounded-[24px] border border-border bg-white/75 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge label={topMover.event_type} eventType={topMover.event_type} />
                  <span className={`font-display text-[1.5rem] font-semibold tracking-[-0.05em] ${colorBySign(topMover.event_day_return)}`}>
                    {pct(topMover.event_day_return)}
                  </span>
                </div>
                <p className="mt-4 font-display text-[1.3rem] font-semibold tracking-[-0.04em] text-text-primary">
                  {topMover.asset}
                </p>
                <p className="mt-1 text-[13px] leading-6 text-text-tertiary">{topMover.event_name}</p>
                <div className="mt-4 flex items-center justify-between text-[12px] text-text-muted">
                  <span>{topMover.event_date}</span>
                  <span className="mono">z {topMover.z_score?.toFixed(2) ?? "--"}</span>
                </div>
              </div>
            ) : (
              <EmptyState title="No standout move yet" message="Load enough event history to surface ranked reactions." />
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent events</CardTitle>
              <CardDescription>
                Latest releases loaded into the system, shown as a quick timeline for recency checks.
              </CardDescription>
            </CardHeader>

            <div className="space-y-3">
              {data.recent_events.map((event, index) => (
                <div
                  key={event.event_id}
                  className="flex items-start gap-3 rounded-[22px] border border-border bg-white/72 px-4 py-3"
                >
                  <div className="mt-1 flex flex-col items-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                    {index !== data.recent_events.length - 1 ? (
                      <span className="mt-2 h-10 w-px bg-border" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={event.event_type} eventType={event.event_type} />
                      <span className="text-[12px] text-text-muted mono">
                        {event.timestamp.slice(0, 10)}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-text-secondary">{event.event_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
