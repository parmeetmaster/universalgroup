import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";

interface YoutubeShort {
  id: string;
  title: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  createdAt: string;
}

interface AviationData {
  stats: { totalShorts: number; totalNotifications: number };
  youtubeShorts: YoutubeShort[];
}

interface AviationDashboardState {
  data: AviationData | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AviationDashboardState = {
  data: null,
  status: "idle",
  error: null,
};

export const fetchAviationDashboard = createAsyncThunk(
  "aviationDashboard/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/aviation");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data as AviationData;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const aviationDashboardSlice = createSlice({
  name: "aviationDashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAviationDashboard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAviationDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchAviationDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

const selectSlice = (state: { aviationDashboard: AviationDashboardState }) => state.aviationDashboard;

export const selectAviationData = createSelector(selectSlice, (s): AviationData | null => s.data);
export const selectAviationLoading = createSelector(selectSlice, (s): boolean => s.status === "loading");
export const selectAviationStats = createSelector(selectAviationData, (d) => d?.stats ?? { totalShorts: 0, totalNotifications: 0 });
export const selectAviationShorts = createSelector(selectAviationData, (d): YoutubeShort[] => d?.youtubeShorts ?? []);
export const selectAviationError = createSelector(selectSlice, (s): string | null => s.error);

export const aviationDashboardReducer = aviationDashboardSlice.reducer;
