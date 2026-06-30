import { createSlice, createAsyncThunk, createSelector, PayloadAction } from "@reduxjs/toolkit";

interface CountriesState {
  localBlocked: string[] | null;
  actionLoading: boolean;
}

const initialState: CountriesState = {
  localBlocked: null,
  actionLoading: false,
};

export const blockCountry = createAsyncThunk(
  "animeCountries/block",
  async (code: string, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: code }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      return d.country as string;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

export const unblockCountry = createAsyncThunk(
  "animeCountries/unblock",
  async (code: string, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/db/anime/countries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: code }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      return code;
    } catch (e) {
      return rejectWithValue(String(e));
    }
  }
);

const countriesSlice = createSlice({
  name: "animeCountries",
  initialState,
  reducers: {
    setLocalBlocked(state, action: PayloadAction<string[] | null>) {
      state.localBlocked = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(blockCountry.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(blockCountry.fulfilled, (state, action) => {
        state.actionLoading = false;
        const current = state.localBlocked ?? [];
        state.localBlocked = [...current, action.payload];
      })
      .addCase(blockCountry.rejected, (state) => {
        state.actionLoading = false;
      })
      .addCase(unblockCountry.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(unblockCountry.fulfilled, (state, action) => {
        state.actionLoading = false;
        const current = state.localBlocked ?? [];
        state.localBlocked = current.filter((c) => c !== action.payload);
      })
      .addCase(unblockCountry.rejected, (state) => {
        state.actionLoading = false;
      });
  },
});

export const { setLocalBlocked } = countriesSlice.actions;

const selectSlice = (state: { animeCountries: CountriesState }) => state.animeCountries;

export const selectLocalBlocked = createSelector(selectSlice, (s) => s.localBlocked);
export const selectCountryActionLoading = createSelector(selectSlice, (s) => s.actionLoading);

export const animeCountriesReducer = countriesSlice.reducer;
