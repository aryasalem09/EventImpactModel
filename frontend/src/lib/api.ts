const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      v.forEach((item) => sp.append(k, String(item)));
    } else {
      sp.set(k, String(v));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// Config
export const getConfig = () => fetchJSON<import("@/types").AppConfig>("/api/config");
export const getAssets = () => fetchJSON<{ configured: string[]; loaded: string[] }>("/api/assets");
export const getEventTypes = () => fetchJSON<{ event_types: string[] }>("/api/event-types");

// Data
export const getDataStatus = () => fetchJSON<import("@/types").DataStatus>("/api/data/status");

export const refreshPrices = (assets?: string[], force = false) =>
  fetchJSON<import("@/types").PriceRefreshResult>(
    `/api/data/refresh-prices${qs({ assets, force })}`,
    { method: "POST" }
  );

export const loadEvents = (filepath?: string) =>
  fetchJSON<import("@/types").EventLoadResult>(
    `/api/data/load-events${qs({ filepath })}`,
    { method: "POST" }
  );

// Analytics
export const getSummary = (params?: { assets?: string[]; event_types?: string[] }) =>
  fetchJSON<import("@/types").SummaryResponse>(`/api/analytics/summary${qs(params ?? {})}`);

export const getEventStudy = (params?: {
  assets?: string[];
  event_types?: string[];
  window?: string;
  estimation_window?: number;
}) => fetchJSON<import("@/types").EventStudyResponse>(`/api/analytics/event-study${qs(params ?? {})}`);

export const getAssetComparison = (params?: {
  assets?: string[];
  event_types?: string[];
  window?: string;
}) => fetchJSON<import("@/types").AssetComparisonResponse>(`/api/analytics/asset-comparison${qs(params ?? {})}`);

export const getRegimes = (params?: {
  regime_type?: string;
  assets?: string[];
  event_types?: string[];
  window?: string;
}) => fetchJSON<import("@/types").RegimeResponse>(`/api/analytics/regimes${qs(params ?? {})}`);

export const getEventDetail = (eventId: string, assets?: string[]) =>
  fetchJSON<import("@/types").EventDetailResponse>(
    `/api/analytics/event/${encodeURIComponent(eventId)}${qs({ assets })}`
  );

export const getExport = (params?: {
  assets?: string[];
  event_types?: string[];
  window?: string;
}) => fetchJSON<{ data: Record<string, unknown>[]; columns: string[]; row_count: number }>(
  `/api/analytics/export${qs(params ?? {})}`
);
