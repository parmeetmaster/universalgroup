import { createSlice, createAsyncThunk, createSelector, PayloadAction } from "@reduxjs/toolkit";

interface TopSite {
  domain: string;
  total_visits: number;
  total_devices: number;
  last_seen: string;
}

interface DailyStat {
  date: string;
  domains: number;
  visits: number;
}

interface AnalyticsState {
  sites: TopSite[];
  daily: DailyStat[];
  status: "idle" | "loading" | "succeeded" | "failed";
  days: string;
  search: string;
}

const initialState: AnalyticsState = {
  sites: [],
  daily: [],
  status: "idle",
  days: "30",
  search: "",
};

function getAuthToken(): string {
  try {
    return JSON.parse(localStorage.getItem("universal_dashboard_auth") || "{}").token || "";
  } catch {
    return "";
  }
}

export const fetchAnalytics = createAsyncThunk(
  "animeAnalytics/fetch",
  async (days: string, { rejectWithValue }) => {
    try {
      const headers: Record<string, string> = { "X-Admin-Token": getAuthToken() };

      const [sitesRes, dailyRes] = await Promise.all([
        fetch(`/api/anime-downloader/admin/analytics/top-sites?days=${days}&limit=100`, { headers }),
        fetch(`/api/anime-downloader/admin/analytics/daily?days=${days}`, { headers }),
      ]);

      let sites: TopSite[] = [];
      let daily: DailyStat[] = [];

      if (sitesRes.ok) {
        const data = await sitesRes.json();
        sites = data.items || [];
      }
      if (dailyRes.ok) {
        const data = await dailyRes.json();
        daily = data || [];
      }

      return { sites, daily };
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const cleanupAnalytics = createAsyncThunk(
  "animeAnalytics/cleanup",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/anime-downloader/admin/analytics/cleanup?days=90", {
        method: "DELETE",
        headers: { "X-Admin-Token": getAuthToken() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.deleted as number;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const analyticsSlice = createSlice({
  name: "animeAnalytics",
  initialState,
  reducers: {
    setAnalyticsDays(state, action: PayloadAction<string>) {
      state.days = action.payload;
    },
    setAnalyticsSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.sites = action.payload.sites;
        state.daily = action.payload.daily;
      })
      .addCase(fetchAnalytics.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export const { setAnalyticsDays, setAnalyticsSearch } = analyticsSlice.actions;

const selectSlice = (state: { animeAnalytics: AnalyticsState }) => state.animeAnalytics;

export const selectAnalyticsSites = createSelector(selectSlice, (s) => s.sites);
export const selectAnalyticsDaily = createSelector(selectSlice, (s) => s.daily);
export const selectAnalyticsLoading = createSelector(selectSlice, (s) => s.status === "loading");
export const selectAnalyticsDays = createSelector(selectSlice, (s) => s.days);
export const selectAnalyticsSearch = createSelector(selectSlice, (s) => s.search);

export const selectFilteredSites = createSelector(
  [selectAnalyticsSites, selectAnalyticsSearch],
  (sites, search) =>
    search ? sites.filter((s) => s.domain.includes(search.toLowerCase())) : sites
);

export const selectTotalVisits = createSelector(selectAnalyticsSites, (sites) =>
  sites.reduce((sum, s) => sum + Number(s.total_visits), 0)
);

export const animeAnalyticsReducer = analyticsSlice.reducer;
