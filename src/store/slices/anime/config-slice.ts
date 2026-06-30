import { createSlice, createAsyncThunk, createSelector, PayloadAction } from "@reduxjs/toolkit";

interface BlockedUrl {
  url: string;
}

interface TopSite {
  name: string;
  url: string;
}

export interface AnimeAppConfig {
  app_version: string;
  update_build_version: number;
  force_update: boolean;
  blocked_urls: BlockedUrl[];
  force_update_after_version: number;
  trends: string[];
  top_sites: TopSite[];
  blocked_regions: string[];
}

interface AnimeConfigState {
  config: AnimeAppConfig | null;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  error: string | null;
}

const initialState: AnimeConfigState = {
  config: null,
  loading: false,
  saving: false,
  dirty: false,
  error: null,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDeepString(val: unknown): any {
  if (val === null || val === undefined) return val;
  if (typeof val !== "string") return val;
  if (!val) return val;
  try {
    let parsed: unknown = val;
    while (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch {
    return val;
  }
}

function parseConfig(raw: unknown): AnimeAppConfig {
  let obj = raw;
  while (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {
      break;
    }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    obj = {};
  }
  const cfg = obj as Record<string, unknown>;

  let blockedUrls: BlockedUrl[] = [];
  try {
    const parsed = parseDeepString(cfg.blocked_urls);
    if (Array.isArray(parsed)) {
      blockedUrls = parsed.filter((u: BlockedUrl) => u && u.url);
    }
  } catch { /* empty */ }

  let trends: string[] = [];
  try {
    const parsed = parseDeepString(cfg.trends);
    if (Array.isArray(parsed)) {
      trends = parsed.filter(Boolean);
    }
  } catch { /* empty */ }

  let topSites: TopSite[] = [];
  try {
    const parsed = parseDeepString(cfg.top_sites);
    if (Array.isArray(parsed)) {
      topSites = parsed.filter((s: TopSite) => s && s.name && s.url);
    }
  } catch { /* empty */ }

  let blockedRegions: string[] = [];
  try {
    const parsed = parseDeepString(cfg.blocked_regions);
    if (Array.isArray(parsed)) {
      blockedRegions = parsed.filter(Boolean);
    }
  } catch { /* empty */ }

  return {
    app_version: String(cfg.app_version || ""),
    update_build_version: Number(cfg.update_build_version) || 0,
    force_update: Boolean(cfg.force_update),
    blocked_urls: blockedUrls,
    force_update_after_version: Number(cfg.force_update_after_version) || 0,
    trends,
    top_sites: topSites,
    blocked_regions: blockedRegions,
  };
}

function configToJson(config: AnimeAppConfig): string {
  return JSON.stringify({
    app_version: config.app_version,
    update_build_version: config.update_build_version,
    force_update: config.force_update,
    blocked_urls: JSON.stringify(config.blocked_urls),
    force_update_after_version: config.force_update_after_version,
    trends: JSON.stringify(config.trends),
    top_sites: JSON.stringify(config.top_sites),
    blocked_regions: JSON.stringify(config.blocked_regions),
  });
}

const DEFAULT_CONFIG: AnimeAppConfig = {
  app_version: "1.0.0",
  update_build_version: 1,
  force_update: false,
  blocked_urls: [],
  force_update_after_version: 1,
  trends: [],
  top_sites: [],
  blocked_regions: [],
};

export const fetchAnimeConfig = createAsyncThunk(
  "animeConfig/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/kv");
      const data = await res.json();
      const entry = data.entries?.find((e: { key: string; value: string }) => e.key === "app_config");
      if (entry) {
        return parseConfig(entry.value);
      }
      return DEFAULT_CONFIG;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const saveAnimeConfig = createAsyncThunk(
  "animeConfig/save",
  async (config: AnimeAppConfig, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "app_config", value: configToJson(config) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return config;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const animeConfigSlice = createSlice({
  name: "animeConfig",
  initialState,
  reducers: {
    updateAnimeConfig(state, action: PayloadAction<Partial<AnimeAppConfig>>) {
      if (state.config) {
        state.config = { ...state.config, ...action.payload };
        state.dirty = true;
      }
    },
    setAnimeConfig(state, action: PayloadAction<AnimeAppConfig>) {
      state.config = action.payload;
    },
    markDirty(state, action: PayloadAction<boolean>) {
      state.dirty = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnimeConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnimeConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
        state.dirty = false;
      })
      .addCase(fetchAnimeConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(saveAnimeConfig.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveAnimeConfig.fulfilled, (state) => {
        state.saving = false;
        state.dirty = false;
      })
      .addCase(saveAnimeConfig.rejected, (state) => {
        state.saving = false;
      });
  },
});

export const { updateAnimeConfig, setAnimeConfig, markDirty } = animeConfigSlice.actions;

const selectSlice = (state: { animeConfig: AnimeConfigState }) => state.animeConfig;

export const selectAnimeConfig = createSelector(selectSlice, (s) => s.config);
export const selectAnimeConfigLoading = createSelector(selectSlice, (s) => s.loading);
export const selectAnimeConfigSaving = createSelector(selectSlice, (s) => s.saving);
export const selectAnimeConfigDirty = createSelector(selectSlice, (s) => s.dirty);
export const selectAnimeConfigError = createSelector(selectSlice, (s) => s.error);

export const animeConfigReducer = animeConfigSlice.reducer;
