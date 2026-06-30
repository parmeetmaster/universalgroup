import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";

interface KvEntry {
  key: string;
  value: string;
  updatedAt: string;
}

interface KvState {
  entries: KvEntry[];
  status: "idle" | "loading" | "succeeded" | "failed";
  saving: boolean;
  deletingKey: string | null;
}

const initialState: KvState = {
  entries: [],
  status: "idle",
  saving: false,
  deletingKey: null,
};

export const fetchKvEntries = createAsyncThunk(
  "animeKv/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/kv");
      const data = await res.json();
      return (data.entries || []) as KvEntry[];
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const addKvEntry = createAsyncThunk(
  "animeKv/add",
  async ({ key, value }: { key: string; value: string }, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return key;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const updateKvEntry = createAsyncThunk(
  "animeKv/update",
  async ({ key, value }: { key: string; value: string }, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return key;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const deleteKvEntry = createAsyncThunk(
  "animeKv/delete",
  async (key: string, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/kv", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return key;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const kvSlice = createSlice({
  name: "animeKv",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchKvEntries.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchKvEntries.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.entries = action.payload;
      })
      .addCase(fetchKvEntries.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(addKvEntry.pending, (state) => {
        state.saving = true;
      })
      .addCase(addKvEntry.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(addKvEntry.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateKvEntry.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateKvEntry.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateKvEntry.rejected, (state) => {
        state.saving = false;
      })
      .addCase(deleteKvEntry.pending, (state, action) => {
        state.deletingKey = action.meta.arg;
      })
      .addCase(deleteKvEntry.fulfilled, (state) => {
        state.deletingKey = null;
      })
      .addCase(deleteKvEntry.rejected, (state) => {
        state.deletingKey = null;
      });
  },
});

const selectSlice = (state: { animeKv: KvState }) => state.animeKv;

export const selectKvEntries = createSelector(selectSlice, (s) => s.entries);
export const selectKvLoading = createSelector(selectSlice, (s) => s.status === "loading");
export const selectKvSaving = createSelector(selectSlice, (s) => s.saving);
export const selectKvDeletingKey = createSelector(selectSlice, (s) => s.deletingKey);

export const animeKvReducer = kvSlice.reducer;
