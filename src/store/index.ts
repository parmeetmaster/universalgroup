"use client";

import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { mangaDashboardReducer } from "./slices/manga/dashboard-slice";
import { mangaConfigReducer } from "./slices/manga/config-slice";
import { pakDashboardReducer } from "./slices/pak/dashboard-slice";
import { pakConfigReducer } from "./slices/pak/config-slice";
import { aviationDashboardReducer } from "./slices/aviation/dashboard-slice";
import { aviationNotificationsReducer } from "./slices/aviation/notifications-slice";
import { aviationConfigReducer } from "./slices/aviation/config-slice";
import { animeDashboardReducer } from "./slices/anime/dashboard-slice";
import { animeCountriesReducer } from "./slices/anime/countries-slice";
import { animeConfigReducer } from "./slices/anime/config-slice";
import { animeScraperReducer } from "./slices/anime/scraper-slice";
import { animeReportsReducer } from "./slices/anime/reports-slice";
import { animeDevicesReducer } from "./slices/anime/devices-slice";
import { animeKvReducer } from "./slices/anime/kv-slice";
import { animeAnalyticsReducer } from "./slices/anime/analytics-slice";
import { animeFeedbackReducer } from "./slices/anime/feedback-slice";
import { cdDashboardReducer } from "./slices/chinese-drama/dashboard-slice";

export const store = configureStore({
  reducer: {
    mangaDashboard: mangaDashboardReducer,
    mangaConfig: mangaConfigReducer,
    pakDashboard: pakDashboardReducer,
    pakConfig: pakConfigReducer,
    aviationDashboard: aviationDashboardReducer,
    aviationNotifications: aviationNotificationsReducer,
    aviationConfig: aviationConfigReducer,
    animeDashboard: animeDashboardReducer,
    animeCountries: animeCountriesReducer,
    animeConfig: animeConfigReducer,
    animeScraper: animeScraperReducer,
    animeReports: animeReportsReducer,
    animeDevices: animeDevicesReducer,
    animeKv: animeKvReducer,
    animeAnalytics: animeAnalyticsReducer,
    animeFeedback: animeFeedbackReducer,
    cdDashboard: cdDashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
