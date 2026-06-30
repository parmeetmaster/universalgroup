import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";

interface MangaData {
  tables: string[];
  stats: Record<string, number>;
  dbStatus: string;
  error?: string;
}

interface MangaDashboardState {
  data: MangaData | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: MangaDashboardState = {
  data: null,
  status: "idle",
  error: null,
};

export const fetchMangaDashboard = createAsyncThunk(
  "mangaDashboard/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/manga");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data as MangaData;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const mangaDashboardSlice = createSlice({
  name: "mangaDashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMangaDashboard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMangaDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchMangaDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

const selectSlice = (state: { mangaDashboard: MangaDashboardState }) => state.mangaDashboard;

export const selectMangaData = createSelector(selectSlice, (s): MangaData | null => s.data);
export const selectMangaLoading = createSelector(selectSlice, (s): boolean => s.status === "loading");
export const selectMangaTables = createSelector(selectMangaData, (d): string[] => d?.tables ?? []);
export const selectMangaStats = createSelector(selectMangaData, (d): Record<string, number> => d?.stats ?? {});
export const selectMangaTotalRows = createSelector(selectMangaStats, (stats): number =>
  Object.values(stats).reduce((a, b) => a + b, 0)
);
export const selectMangaDbStatus = createSelector(selectMangaData, (d): string => d?.dbStatus ?? "");
export const selectMangaError = createSelector(selectSlice, (s): string | null => s.error);

export const mangaDashboardReducer = mangaDashboardSlice.reducer;
