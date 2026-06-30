import { createSlice, createAsyncThunk, createSelector, PayloadAction } from "@reduxjs/toolkit";

interface ConfigSliceOptions {
  name: string;
  apiPath: string;
  defaults: Record<string, unknown>;
  parseResponse: (data: unknown) => Record<string, unknown>;
  serializeForSave?: (config: Record<string, unknown>) => unknown;
}

interface ConfigState {
  config: Record<string, unknown> | null;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  error: string | null;
}

export function createConfigSlice(options: ConfigSliceOptions) {
  const { name, apiPath, defaults, parseResponse, serializeForSave } = options;

  const initialState: ConfigState = {
    config: null,
    loading: false,
    saving: false,
    dirty: false,
    error: null,
  };

  const fetchConfig = createAsyncThunk(`${name}/fetch`, async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(apiPath);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return parseResponse(data);
    } catch (e) {
      return rejectWithValue(String(e));
    }
  });

  const saveConfig = createAsyncThunk(`${name}/save`, async (config: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const body = serializeForSave ? serializeForSave(config) : config;
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return config;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  });

  const slice = createSlice({
    name,
    initialState,
    reducers: {
      updateConfig(state, action: PayloadAction<Record<string, unknown>>) {
        if (state.config) {
          Object.assign(state.config, action.payload);
          state.dirty = true;
        }
      },
      setConfig(state, action: PayloadAction<Record<string, unknown>>) {
        state.config = action.payload;
        state.dirty = true;
      },
      resetConfig(state) {
        state.config = { ...defaults };
        state.dirty = false;
      },
      clearError(state) {
        state.error = null;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchConfig.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchConfig.fulfilled, (state, action) => {
          state.loading = false;
          state.config = action.payload;
          state.dirty = false;
        })
        .addCase(fetchConfig.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        })
        .addCase(saveConfig.pending, (state) => {
          state.saving = true;
        })
        .addCase(saveConfig.fulfilled, (state, action) => {
          state.saving = false;
          state.config = action.payload;
          state.dirty = false;
        })
        .addCase(saveConfig.rejected, (state, action) => {
          state.saving = false;
          state.error = action.payload as string;
        });
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectSlice = (state: any) => state[name] as ConfigState;

  const selectors = {
    selectConfig: createSelector(selectSlice, (s) => s.config),
    selectLoading: createSelector(selectSlice, (s) => s.loading),
    selectSaving: createSelector(selectSlice, (s) => s.saving),
    selectDirty: createSelector(selectSlice, (s) => s.dirty),
    selectError: createSelector(selectSlice, (s) => s.error),
  };

  return {
    reducer: slice.reducer,
    actions: slice.actions,
    thunks: { fetchConfig, saveConfig },
    selectors,
  };
}
