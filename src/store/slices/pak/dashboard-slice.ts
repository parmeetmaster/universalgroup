import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";

interface PakData {
  stats: { totalDramas: number; totalEpisodes: number; totalGenres: number };
  dramas: Array<{ id: string; title: string; slug: string; status: string }>;
  genres: Array<{ id: string; name: string; slug: string }>;
  recentEpisodes: Array<{ id: string; title: string; number: number; dramaTitle: string }>;
}

interface PakDashboardState {
  data: PakData | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  searchQuery: string;
  searchResults: Record<string, string>[] | null;
  searchLoading: boolean;
}

const initialState: PakDashboardState = {
  data: null,
  status: "idle",
  error: null,
  searchQuery: "",
  searchResults: null,
  searchLoading: false,
};

export const fetchPakDashboard = createAsyncThunk(
  "pakDashboard/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/pak");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data as PakData;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const searchPakDramas = createAsyncThunk(
  "pakDashboard/search",
  async (query: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/db/pak/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return (data?.results || []) as Record<string, string>[];
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const pakDashboardSlice = createSlice({
  name: "pakDashboard",
  initialState,
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPakDashboard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPakDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchPakDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(searchPakDramas.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchPakDramas.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchPakDramas.rejected, (state) => {
        state.searchLoading = false;
        state.searchResults = [];
      });
  },
});

const selectSlice = (state: { pakDashboard: PakDashboardState }) => state.pakDashboard;

export const selectPakData = createSelector(selectSlice, (s): PakData | null => s.data);
export const selectPakLoading = createSelector(selectSlice, (s): boolean => s.status === "loading");
export const selectPakStats = createSelector(selectPakData, (d) => d?.stats ?? { totalDramas: 0, totalEpisodes: 0, totalGenres: 0 });
export const selectPakDramas = createSelector(selectPakData, (d) => d?.dramas ?? []);
export const selectPakGenres = createSelector(selectPakData, (d) => d?.genres ?? []);
export const selectPakRecentEpisodes = createSelector(selectPakData, (d) => d?.recentEpisodes ?? []);
export const selectPakSearchResults = createSelector(selectSlice, (s) => s.searchResults);
export const selectPakSearchLoading = createSelector(selectSlice, (s): boolean => s.searchLoading);

export const { setSearchQuery } = pakDashboardSlice.actions;
export const pakDashboardReducer = pakDashboardSlice.reducer;
