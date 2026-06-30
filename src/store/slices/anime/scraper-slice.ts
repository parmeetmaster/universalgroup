import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";

interface Episode {
  url: string;
  first_seen_at: string;
  created_at: string;
}

interface ScraperState {
  episodes: Episode[];
  total: number;
  status: "idle" | "loading" | "succeeded" | "failed";
  scraping: boolean;
  scrapeResult: string | null;
}

const initialState: ScraperState = {
  episodes: [],
  total: 0,
  status: "idle",
  scraping: false,
  scrapeResult: null,
};

export const fetchScraperData = createAsyncThunk(
  "animeScraper/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/scrape");
      const data = await res.json();
      return { episodes: data.recentEpisodes || [], total: data.totalEpisodes || 0 };
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const triggerScraperScrape = createAsyncThunk(
  "animeScraper/triggerScrape",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/scrape", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error("Scrape failed");
      return JSON.stringify(data.data, null, 2);
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const scraperSlice = createSlice({
  name: "animeScraper",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchScraperData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchScraperData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.episodes = action.payload.episodes;
        state.total = action.payload.total;
      })
      .addCase(fetchScraperData.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(triggerScraperScrape.pending, (state) => {
        state.scraping = true;
        state.scrapeResult = null;
      })
      .addCase(triggerScraperScrape.fulfilled, (state, action) => {
        state.scraping = false;
        state.scrapeResult = action.payload;
      })
      .addCase(triggerScraperScrape.rejected, (state) => {
        state.scraping = false;
      });
  },
});

const selectSlice = (state: { animeScraper: ScraperState }) => state.animeScraper;

export const selectScraperEpisodes = createSelector(selectSlice, (s) => s.episodes);
export const selectScraperTotal = createSelector(selectSlice, (s) => s.total);
export const selectScraperLoading = createSelector(selectSlice, (s) => s.status === "loading");
export const selectScraperScraping = createSelector(selectSlice, (s) => s.scraping);
export const selectScraperResult = createSelector(selectSlice, (s) => s.scrapeResult);

export const animeScraperReducer = scraperSlice.reducer;
