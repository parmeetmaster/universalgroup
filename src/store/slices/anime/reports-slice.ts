import { createSlice, createAsyncThunk, createSelector, PayloadAction } from "@reduxjs/toolkit";

interface Report {
  id: number;
  device_name: string;
  app_version: string;
  error_title: string;
  error_message: string;
  download_url: string;
  additional_info: string;
  status: "open" | "ack" | "closed";
  admin_notes: string;
  created_at: string;
  updated_at: string;
  location: string | null;
}

interface ReportsResponse {
  total: number;
  counts: { total: number; open: number; ack: number; closed: number };
  items: Report[];
}

type StatusFilter = "all" | "open" | "ack" | "closed";

interface ReportsState {
  data: ReportsResponse | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  filter: StatusFilter;
  search: string;
  offset: number;
  savingId: number | null;
  deletingId: number | null;
  massDeleting: boolean;
}

const LIMIT = 20;

const initialState: ReportsState = {
  data: null,
  status: "idle",
  filter: "all",
  search: "",
  offset: 0,
  savingId: null,
  deletingId: null,
  massDeleting: false,
};

export const fetchReports = createAsyncThunk(
  "animeReports/fetch",
  async (
    { filter, search, offset }: { filter: StatusFilter; search: string; offset: number },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (filter !== "all") params.set("status", filter);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/db/anime/reports?${params}`);
      const json: ReportsResponse = await res.json();
      return json;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const patchReport = createAsyncThunk(
  "animeReports/patch",
  async ({ id, body }: { id: number; body: Record<string, string> }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/db/anime/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!(await res.json()).success) throw new Error("Update failed");
      return { id, body };
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const deleteReport = createAsyncThunk(
  "animeReports/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/db/anime/reports/${id}`, { method: "DELETE" });
      if (!(await res.json()).success) throw new Error("Delete failed");
      return id;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const deleteAllReports = createAsyncThunk(
  "animeReports/deleteAll",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status ? `/api/db/anime/reports?status=${status}` : "/api/db/anime/reports";
      const res = await fetch(url, { method: "DELETE" });
      if (!(await res.json()).success) throw new Error("Delete failed");
      return status;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const reportsSlice = createSlice({
  name: "animeReports",
  initialState,
  reducers: {
    setReportsFilter(state, action: PayloadAction<StatusFilter>) {
      state.filter = action.payload;
      state.offset = 0;
    },
    setReportsSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.offset = 0;
    },
    setReportsOffset(state, action: PayloadAction<number>) {
      state.offset = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchReports.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(patchReport.pending, (state, action) => {
        state.savingId = action.meta.arg.id;
      })
      .addCase(patchReport.fulfilled, (state) => {
        state.savingId = null;
      })
      .addCase(patchReport.rejected, (state) => {
        state.savingId = null;
      })
      .addCase(deleteReport.pending, (state, action) => {
        state.deletingId = action.meta.arg;
      })
      .addCase(deleteReport.fulfilled, (state) => {
        state.deletingId = null;
      })
      .addCase(deleteReport.rejected, (state) => {
        state.deletingId = null;
      })
      .addCase(deleteAllReports.pending, (state) => {
        state.massDeleting = true;
      })
      .addCase(deleteAllReports.fulfilled, (state) => {
        state.massDeleting = false;
        state.offset = 0;
      })
      .addCase(deleteAllReports.rejected, (state) => {
        state.massDeleting = false;
      });
  },
});

export const { setReportsFilter, setReportsSearch, setReportsOffset } = reportsSlice.actions;

const selectSlice = (state: { animeReports: ReportsState }) => state.animeReports;

export const selectReportsData = createSelector(selectSlice, (s) => s.data);
export const selectReportsCounts = createSelector(
  selectReportsData,
  (d) => d?.counts ?? { total: 0, open: 0, ack: 0, closed: 0 }
);
export const selectReportsItems = createSelector(selectReportsData, (d) => d?.items ?? []);
export const selectReportsLoading = createSelector(selectSlice, (s) => s.status === "loading");
export const selectReportsFilter = createSelector(selectSlice, (s) => s.filter);
export const selectReportsSearch = createSelector(selectSlice, (s) => s.search);
export const selectReportsOffset = createSelector(selectSlice, (s) => s.offset);
export const selectReportsTotal = createSelector(selectReportsData, (d) => d?.total ?? 0);
export const selectReportsSavingId = createSelector(selectSlice, (s) => s.savingId);
export const selectReportsDeletingId = createSelector(selectSlice, (s) => s.deletingId);
export const selectReportsMassDeleting = createSelector(selectSlice, (s) => s.massDeleting);

export const animeReportsReducer = reportsSlice.reducer;
