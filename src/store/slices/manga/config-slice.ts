import { createConfigSlice } from "@/store/helpers/create-config-slice";

const DEFAULTS = {
  min_app_version: "1.0.0",
  latest_app_version: "1.0.0",
  force_update: false,
  maintenance_mode: false,
  maintenance_message: "",
  announcement: "",
  play_store_url: "",
  support_email: "",
  privacy_url: "",
  terms_url: "",
};

const mangaConfig = createConfigSlice({
  name: "mangaConfig",
  apiPath: "/api/db/manga/config",
  defaults: DEFAULTS,
  parseResponse: (data: unknown) => {
    const d = data as Record<string, unknown>;
    const c = (d.config || {}) as Record<string, unknown>;
    return {
      min_app_version: String(c.min_app_version ?? DEFAULTS.min_app_version),
      latest_app_version: String(c.latest_app_version ?? DEFAULTS.latest_app_version),
      force_update: Boolean(c.force_update ?? DEFAULTS.force_update),
      maintenance_mode: Boolean(c.maintenance_mode ?? DEFAULTS.maintenance_mode),
      maintenance_message: String(c.maintenance_message ?? ""),
      announcement: String(c.announcement ?? ""),
      play_store_url: String(c.play_store_url ?? ""),
      support_email: String(c.support_email ?? ""),
      privacy_url: String(c.privacy_url ?? ""),
      terms_url: String(c.terms_url ?? ""),
    };
  },
});

export const mangaConfigReducer = mangaConfig.reducer;
export const mangaConfigActions = mangaConfig.actions;
export const mangaConfigThunks = mangaConfig.thunks;
export const mangaConfigSelectors = mangaConfig.selectors;
