import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";

interface CdEpisode {
  id: string;
  title: string;
  episodeNumber: number;
  sourceType: string;
  isVip: boolean;
  status: string;
  createdAt: string;
  dramaTitle: string;
}

interface CdUser {
  id: string;
  name: string;
  email: string;
  country: string;
  device: string;
  lastLoginAt: string;
}

interface CdData {
  stats: {
    totalDramas: number;
    totalEpisodes: number;
    totalUsers: number;
    totalGenres: number;
  };
  recentEpisodes: CdEpisode[];
  recentUsers: CdUser[];
}

interface CdDashboardState {
  data: CdData | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CdDashboardState = {
  data: null,
  status: "idle",
  error: null,
};

export const fetchCdDashboard = createAsyncThunk(
  "cdDashboard/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/chinese-drama");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data as CdData;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const cdDashboardSlice = createSlice({
  name: "cdDashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCdDashboard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCdDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchCdDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

const selectSlice = (state: { cdDashboard: CdDashboardState }) => state.cdDashboard;

export const selectCdData = createSelector(selectSlice, (s): CdData | null => s.data);
export const selectCdLoading = createSelector(selectSlice, (s): boolean => s.status === "loading");
export const selectCdError = createSelector(selectSlice, (s): string | null => s.error);
export const selectCdStats = createSelector(selectCdData, (d) => d?.stats ?? { totalDramas: 0, totalEpisodes: 0, totalUsers: 0, totalGenres: 0 });
export const selectCdRecentEpisodes = createSelector(selectCdData, (d) => d?.recentEpisodes ?? []);
export const selectCdRecentUsers = createSelector(selectCdData, (d) => d?.recentUsers ?? []);

export const cdDashboardReducer = cdDashboardSlice.reducer;
