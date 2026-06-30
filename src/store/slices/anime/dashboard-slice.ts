import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";

interface AnimeStats {
  seenEpisodes: number;
  registeredCountries: number;
  blockedCountries: number;
  kvEntries: number;
}

interface AnimeData {
  stats: AnimeStats;
  countries: string[];
  blocked: string[];
  kvEntries: Array<{ key: string; value: string }>;
}

interface AnimeDashboardState {
  data: AnimeData | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  scraping: boolean;
  scrapeResult: string | null;
}

const initialState: AnimeDashboardState = {
  data: null,
  status: "idle",
  error: null,
  scraping: false,
  scrapeResult: null,
};

export const fetchAnimeDashboard = createAsyncThunk(
  "animeDashboard/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data as AnimeData;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const triggerScrape = createAsyncThunk(
  "animeDashboard/triggerScrape",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/scrape", { method: "POST" });
      const data = await res.json();
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const animeDashboardSlice = createSlice({
  name: "animeDashboard",
  initialState,
  reducers: {
    clearScrapeResult(state) {
      state.scrapeResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnimeDashboard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAnimeDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchAnimeDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(triggerScrape.pending, (state) => {
        state.scraping = true;
        state.scrapeResult = null;
      })
      .addCase(triggerScrape.fulfilled, (state, action) => {
        state.scraping = false;
        state.scrapeResult = action.payload;
      })
      .addCase(triggerScrape.rejected, (state, action) => {
        state.scraping = false;
        state.scrapeResult = `Error: ${action.payload}`;
      });
  },
});

export const { clearScrapeResult } = animeDashboardSlice.actions;

const selectSlice = (state: { animeDashboard: AnimeDashboardState }) => state.animeDashboard;

export const selectAnimeData = createSelector(selectSlice, (s) => s.data);
export const selectAnimeLoading = createSelector(selectSlice, (s) => s.status === "loading");
export const selectAnimeStats = createSelector(selectAnimeData, (d) => d?.stats ?? null);
export const selectAnimeCountries = createSelector(selectAnimeData, (d) => d?.countries ?? []);
export const selectAnimeBlocked = createSelector(selectAnimeData, (d) => d?.blocked ?? []);
export const selectAnimeKvEntries = createSelector(selectAnimeData, (d) => d?.kvEntries ?? []);
export const selectAnimeScraping = createSelector(selectSlice, (s) => s.scraping);
export const selectAnimeScrapeResult = createSelector(selectSlice, (s) => s.scrapeResult);

export const animeDashboardReducer = animeDashboardSlice.reducer;
