import { createSlice, createAsyncThunk, createSelector, PayloadAction } from "@reduxjs/toolkit";

interface Notification {
  id: number;
  title?: string;
  body?: string;
  article_url?: string;
  topic?: string;
  created_at?: string;
}

interface AviationNotificationsState {
  notifications: Notification[];
  total: number;
  status: "idle" | "loading" | "succeeded" | "failed";
  offset: number;
}

const initialState: AviationNotificationsState = {
  notifications: [],
  total: 0,
  status: "idle",
  offset: 0,
};

export const fetchNotifications = createAsyncThunk(
  "aviationNotifications/fetch",
  async ({ offset, limit }: { offset: number; limit: number }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/db/aviation/notifications?limit=${limit}&offset=${offset}`);
      const data = await res.json();
      return { notifications: data.notifications || [], total: data.total || 0 };
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const aviationNotificationsSlice = createSlice({
  name: "aviationNotifications",
  initialState,
  reducers: {
    setNotificationsOffset(state, action: PayloadAction<number>) {
      state.offset = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notifications = action.payload.notifications;
        state.total = action.payload.total;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.status = "failed";
      });
  },
});

const selectSlice = (state: { aviationNotifications: AviationNotificationsState }) => state.aviationNotifications;

export const selectNotifications = createSelector(selectSlice, (s) => s.notifications);
export const selectNotificationsTotal = createSelector(selectSlice, (s) => s.total);
export const selectNotificationsLoading = createSelector(selectSlice, (s) => s.status === "loading");
export const selectNotificationsOffset = createSelector(selectSlice, (s) => s.offset);

export const { setNotificationsOffset } = aviationNotificationsSlice.actions;
export const aviationNotificationsReducer = aviationNotificationsSlice.reducer;
