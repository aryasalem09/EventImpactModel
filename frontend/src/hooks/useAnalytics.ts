import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useSummary(params?: { assets?: string[]; event_types?: string[] }) {
  return useQuery({
    queryKey: ["summary", params],
    queryFn: () => api.getSummary(params),
  });
}

export function useEventStudy(params?: {
  assets?: string[];
  event_types?: string[];
  window?: string;
  estimation_window?: number;
}) {
  return useQuery({
    queryKey: ["event-study", params],
    queryFn: () => api.getEventStudy(params),
  });
}

export function useAssetComparison(params?: {
  assets?: string[];
  event_types?: string[];
  window?: string;
}) {
  return useQuery({
    queryKey: ["asset-comparison", params],
    queryFn: () => api.getAssetComparison(params),
  });
}

export function useRegimes(params?: {
  regime_type?: string;
  assets?: string[];
  event_types?: string[];
  window?: string;
}) {
  return useQuery({
    queryKey: ["regimes", params],
    queryFn: () => api.getRegimes(params),
  });
}

export function useEventDetail(eventId: string | null, assets?: string[]) {
  return useQuery({
    queryKey: ["event-detail", eventId, assets],
    queryFn: () => api.getEventDetail(eventId!, assets),
    enabled: !!eventId,
  });
}

export function useDataStatus() {
  return useQuery({
    queryKey: ["data-status"],
    queryFn: api.getDataStatus,
  });
}

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: api.getConfig,
  });
}

export function useAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: api.getAssets,
  });
}

export function useEventTypes() {
  return useQuery({
    queryKey: ["event-types"],
    queryFn: api.getEventTypes,
  });
}
