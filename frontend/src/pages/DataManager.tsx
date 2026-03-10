import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDataStatus, useConfig } from "@/hooks/useAnalytics";
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
import PageHeader from "@/components/ui/PageHeader";
import * as api from "@/lib/api";

export default function DataManager() {
  const queryClient = useQueryClient();
  const { data: status, isLoading, error, refetch } = useDataStatus();
  const { data: config } = useConfig();
  const [loadResult, setLoadResult] = useState("");

  const refreshMutation = useMutation({
    mutationFn: () => api.refreshPrices(config?.default_assets),
    onSuccess: (result) => {
      setLoadResult(
        `Refreshed ${result.assets_refreshed.length} assets.${result.assets_failed.length ? ` Failed: ${result.assets_failed.join(", ")}` : ""}`
      );
      queryClient.invalidateQueries();
    },
    onError: (err) => setLoadResult(`Error: ${err}`),
  });

  const loadEventsMutation = useMutation({
    mutationFn: () => api.loadEvents(),
    onSuccess: (result) => {
      setLoadResult(
        `Loaded ${result.valid_rows}/${result.total_rows} events. Types: ${result.event_types.join(", ") || "none"}`
      );
      queryClient.invalidateQueries();
    },
    onError: (err) => setLoadResult(`Error: ${err}`),
  });

  if (isLoading) return <LoadingSpinner text="Checking local data status..." />;
  if (error) return <ErrorState message={String(error)} onRetry={refetch} />;

  const cacheStatus = status?.cache_status ?? "unknown";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Repository operations"
        title="Control the local event and price store"
        description="Reload bundled event files, refresh market prices, and confirm that the analytics layer has the coverage it needs before you share or demo the project."
        stats={[
          { label: "Events loaded", value: status?.events_loaded ?? 0, tone: "accent" },
          { label: "Assets loaded", value: status?.assets_loaded.length ?? 0 },
          { label: "Event files", value: status?.event_files.length ?? 0 },
          { label: "Cache status", value: cacheStatus, tone: "amber" },
        ]}
      >
        <div className="filter-panel rounded-[26px] border border-border p-4">
          <p className="section-kicker">Data actions</p>
          <p className="mt-2 text-[13px] leading-6 text-text-tertiary">
            Reload the seeded event set whenever CSVs change, and refresh prices when you need newer history.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadEventsMutation.mutate()}
              disabled={loadEventsMutation.isPending}
              className="action-button action-button--primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadEventsMutation.isPending ? "Loading events..." : "Load event files"}
            </button>
            <button
              type="button"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="action-button action-button--secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshMutation.isPending ? "Refreshing prices..." : "Refresh prices"}
            </button>
          </div>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Events Loaded" value={status?.events_loaded ?? 0} sub="Validated event rows currently available in memory." />
        <StatCard label="Assets Loaded" value={status?.assets_loaded.length ?? 0} sub="Price histories ready for analytics requests." />
        <StatCard label="Event Types" value={status?.event_types.length ?? 0} sub="Distinct event families detected from loaded files." />
        <StatCard label="Cache Status" value={cacheStatus} sub="High-level state of the local price cache." />
      </div>

      {loadResult ? (
        <div className="surface-card rounded-[26px] border border-border px-5 py-4">
          <p className="section-kicker">Last operation</p>
          <p className="mt-2 text-[13px] leading-6 text-text-secondary">{loadResult}</p>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Event files</CardTitle>
            <CardDescription>
              CSV inputs bundled with the project. These become the event universe after validation.
            </CardDescription>
          </CardHeader>

          {status?.event_files.length ? (
            <div className="space-y-3">
              {status.event_files.map((file) => (
                <div
                  key={file}
                  className="rounded-[22px] border border-border bg-white/72 px-4 py-3 text-[13px] text-text-secondary"
                >
                  <span className="mono text-[12px] text-text-muted">data/events/</span>
                  <span className="ml-1 font-medium">{file}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No event files found" message="Add CSVs under data/events to seed the system." />
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loaded assets and date ranges</CardTitle>
            <CardDescription>
              Confirm that each configured instrument has the expected historical coverage before running analysis.
            </CardDescription>
          </CardHeader>

          {status?.assets_loaded.length ? (
            <div className="overflow-hidden rounded-[24px] border border-border bg-white/68">
              <div className="overflow-auto">
                <table className="data-table text-[13px]">
                  <thead className="bg-white/92">
                    <tr>
                      <th className="pb-3 pl-4 pr-4 pt-4 text-left">Asset</th>
                      <th className="pb-3 pr-4 pt-4 text-left">Start</th>
                      <th className="pb-3 pr-4 pt-4 text-left">End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.assets_loaded.map((asset) => {
                      const range = status.price_date_ranges[asset];

                      return (
                        <tr key={asset}>
                          <td className="py-3 pl-4 pr-4 font-semibold text-text-primary">{asset}</td>
                          <td className="py-3 pr-4 text-[12px] text-text-muted mono">{range?.[0] ?? "--"}</td>
                          <td className="py-3 pr-4 text-[12px] text-text-muted mono">{range?.[1] ?? "--"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No price data loaded"
              message="Refresh prices to download or update the local asset histories."
            />
          )}
        </Card>
      </div>

      {config ? (
        <Card>
          <CardHeader>
            <CardTitle>Runtime configuration</CardTitle>
            <CardDescription>
              Defaults exposed by the backend so the analytics assumptions are visible from the UI.
            </CardDescription>
          </CardHeader>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-[22px] border border-border bg-white/72 px-4 py-4">
              <p className="section-kicker">Default assets</p>
              <p className="mt-3 text-[13px] leading-6 text-text-secondary">{config.default_assets.join(", ")}</p>
            </div>
            <div className="rounded-[22px] border border-border bg-white/72 px-4 py-4">
              <p className="section-kicker">Estimation window</p>
              <p className="mt-3 font-display text-[1.55rem] font-semibold tracking-[-0.04em] text-text-primary">
                {config.default_estimation_window}
              </p>
              <p className="text-[12px] text-text-tertiary">trading days</p>
            </div>
            <div className="rounded-[22px] border border-border bg-white/72 px-4 py-4">
              <p className="section-kicker">Benchmark</p>
              <p className="mt-3 font-display text-[1.55rem] font-semibold tracking-[-0.04em] text-text-primary">
                {config.default_benchmark}
              </p>
            </div>
            <div className="rounded-[22px] border border-border bg-white/72 px-4 py-4">
              <p className="section-kicker">Rolling vol window</p>
              <p className="mt-3 font-display text-[1.55rem] font-semibold tracking-[-0.04em] text-text-primary">
                {config.rolling_vol_window}
              </p>
              <p className="text-[12px] text-text-tertiary">days</p>
            </div>
            <div className="rounded-[22px] border border-border bg-white/72 px-4 py-4">
              <p className="section-kicker">Annualization factor</p>
              <p className="mt-3 font-display text-[1.55rem] font-semibold tracking-[-0.04em] text-text-primary">
                {config.annualization_factor}
              </p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
