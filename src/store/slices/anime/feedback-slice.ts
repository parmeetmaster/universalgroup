import { createSlice, createAsyncThunk, createSelector, PayloadAction } from "@reduxjs/toolkit";

interface FeedbackEntry {
  id: number;
  rating: number;
  problem_types: string | null;
  description: string | null;
  device_model: string | null;
  app_version: string | null;
  android_version: string | null;
  created_at: string;
}

interface RatingDistItem {
  rating: number;
  count: number;
}

interface FeedbackResponse {
  data: FeedbackEntry[];
  total: number;
  avgRating: number;
  ratingDistribution: RatingDistItem[];
}

interface FeedbackState {
  data: FeedbackResponse | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  offset: number;
  ratingFilter: string;
}

const LIMIT = 20;

const initialState: FeedbackState = {
  data: null,
  status: "idle",
  offset: 0,
  ratingFilter: "all",
};

export const fetchFeedback = createAsyncThunk(
  "animeFeedback/fetch",
  async ({ offset, ratingFilter }: { offset: number; ratingFilter: string }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(offset),
      });
      if (ratingFilter !== "all") params.set("rating", ratingFilter);
      const res = await fetch(`/api/db/anime/feedback?${params}`);
      const json: FeedbackResponse = await res.json();
      return json;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const feedbackSlice = createSlice({
  name: "animeFeedback",
  initialState,
  reducers: {
    setFeedbackOffset(state, action: PayloadAction<number>) {
      state.offset = action.payload;
    },
    setFeedbackRatingFilter(state, action: PayloadAction<string>) {
      state.ratingFilter = action.payload;
      state.offset = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedback.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFeedback.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchFeedback.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export const { setFeedbackOffset, setFeedbackRatingFilter } = feedbackSlice.actions;

const selectSlice = (state: { animeFeedback: FeedbackState }) => state.animeFeedback;

export const selectFeedbackData = createSelector(selectSlice, (s) => s.data);
export const selectFeedbackItems = createSelector(selectFeedbackData, (d) => d?.data ?? []);
export const selectFeedbackLoading = createSelector(selectSlice, (s) => s.status === "loading");
export const selectFeedbackAvgRating = createSelector(selectFeedbackData, (d) => d?.avgRating ?? 0);
export const selectFeedbackDistribution = createSelector(
  selectFeedbackData,
  (d) => d?.ratingDistribution ?? []
);
export const selectFeedbackTotal = createSelector(selectFeedbackData, (d) => d?.total ?? 0);
export const selectFeedbackOffset = createSelector(selectSlice, (s) => s.offset);
export const selectFeedbackRatingFilter = createSelector(selectSlice, (s) => s.ratingFilter);

export const animeFeedbackReducer = feedbackSlice.reducer;
