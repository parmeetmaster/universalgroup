import { createSlice, createAsyncThunk, createSelector, PayloadAction } from "@reduxjs/toolkit";

interface DailyInstall {
  date: string;
  count: string;
}

interface Device {
  id: number;
  fcm_token: string;
  country: string | null;
  app_version: string | null;
  device_model: string | null;
  status: "active" | "uninstalled";
  ping_failures: number;
  registered_at: string;
  last_active_at: string | null;
  uninstalled_at: string | null;
}

interface DevicesData {
  stats: { total: number; active: number; uninstalled: number; uninstallRate: number };
  dailyInstalls: DailyInstall[];
  devices: Device[];
  pagination: { total: number; page: number; limit: number };
}

interface DevicesState {
  data: DevicesData | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  statusFilter: string;
  page: number;
  pinging: boolean;
}

const initialState: DevicesState = {
  data: null,
  status: "idle",
  statusFilter: "all",
  page: 1,
  pinging: false,
};

export const fetchDevices = createAsyncThunk(
  "animeDevices/fetch",
  async ({ page, statusFilter }: { page: number; statusFilter: string }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/db/anime/devices?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as DevicesData;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const pingAllDevices = createAsyncThunk(
  "animeDevices/pingAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ping" }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      return d as { total: number; uninstalled: number };
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const devicesSlice = createSlice({
  name: "animeDevices",
  initialState,
  reducers: {
    setDeviceStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setDevicesPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchDevices.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(pingAllDevices.pending, (state) => {
        state.pinging = true;
      })
      .addCase(pingAllDevices.fulfilled, (state) => {
        state.pinging = false;
      })
      .addCase(pingAllDevices.rejected, (state) => {
        state.pinging = false;
      });
  },
});

export const { setDeviceStatusFilter, setDevicesPage } = devicesSlice.actions;

const selectSlice = (state: { animeDevices: DevicesState }) => state.animeDevices;

export const selectDevicesData = createSelector(selectSlice, (s) => s.data);
export const selectDevicesStats = createSelector(selectDevicesData, (d) => d?.stats ?? null);
export const selectDevicesList = createSelector(selectDevicesData, (d) => d?.devices ?? []);
export const selectDevicesLoading = createSelector(selectSlice, (s) => s.status === "loading");
export const selectDevicesTotalPages = createSelector(
  selectDevicesData,
  (d) => (d ? Math.ceil(d.pagination.total / 20) : 1)
);
export const selectDevicesPinging = createSelector(selectSlice, (s) => s.pinging);
export const selectDevicesStatusFilter = createSelector(selectSlice, (s) => s.statusFilter);
export const selectDevicesPage = createSelector(selectSlice, (s) => s.page);
export const selectDevicesPagination = createSelector(selectDevicesData, (d) => d?.pagination ?? null);
export const selectDevicesDailyInstalls = createSelector(selectDevicesData, (d) => d?.dailyInstalls ?? []);

export const animeDevicesReducer = devicesSlice.reducer;
