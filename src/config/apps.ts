import { IconType } from "react-icons";
import {
  MdDashboard,
  MdVideoLibrary,
  MdSettings,
  MdStorage,
  MdPublic,
  MdMovie,
  MdCategory,
  MdSearch,
  MdNewspaper,
  MdFlight,
  MdOndemandVideo,
  MdRssFeed,
  MdNotifications,
  MdTune,
  MdMenuBook,
  MdBookmark,
  MdBugReport,
  MdDevices,
} from "react-icons/md";

export interface NavItem {
  label: string;
  icon: IconType;
  id: string;
}

export interface AppConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: IconType;
  gradient: string;
  apiBase: string;
  navItems: NavItem[];
}

export const apps: AppConfig[] = [
  {
    id: "anime-downloader",
    name: "Video Downloader",
    shortName: "VD",
    description: "Anime scraping & push notifications",
    icon: MdVideoLibrary,
    gradient: "linear(135deg, #a855f7, #7c3aed)",
    apiBase: "http://194.163.133.119:3050",
    navItems: [
      { label: "Dashboard", icon: MdDashboard, id: "dashboard" },
      { label: "Scraper", icon: MdRssFeed, id: "scraper" },
      { label: "Reports", icon: MdBugReport, id: "reports" },
      { label: "Countries", icon: MdPublic, id: "countries" },
      { label: "Devices", icon: MdDevices, id: "devices" },
      { label: "KV Store", icon: MdStorage, id: "kv-store" },
      { label: "Settings", icon: MdSettings, id: "settings" },
    ],
  },
  {
    id: "pakistani-serials",
    name: "Pakistani Serials",
    shortName: "PS",
    description: "Drama streaming & content management",
    icon: MdMovie,
    gradient: "linear(135deg, #06b6d4, #0891b2)",
    apiBase: "http://194.163.133.119:786",
    navItems: [
      { label: "Dashboard", icon: MdDashboard, id: "dashboard" },
      { label: "Dramas", icon: MdMovie, id: "dramas" },
      { label: "Genres", icon: MdCategory, id: "genres" },
      { label: "Search", icon: MdSearch, id: "search" },
      { label: "Config", icon: MdTune, id: "config" },
    ],
  },
  {
    id: "aviation-news",
    name: "Aviation News",
    shortName: "AN",
    description: "Aviation news & notifications",
    icon: MdFlight,
    gradient: "linear(135deg, #f97316, #ea580c)",
    apiBase: "http://194.163.133.119:3043",
    navItems: [
      { label: "Dashboard", icon: MdDashboard, id: "dashboard" },
      { label: "Articles", icon: MdNewspaper, id: "articles" },
      { label: "YouTube Shorts", icon: MdOndemandVideo, id: "youtube-shorts" },
      { label: "Notifications", icon: MdNotifications, id: "notifications" },
      { label: "Settings", icon: MdSettings, id: "settings" },
    ],
  },
  {
    id: "manga-app",
    name: "Manga App",
    shortName: "MA",
    description: "Manga reader & library management",
    icon: MdMenuBook,
    gradient: "linear(135deg, #ec4899, #db2777)",
    apiBase: "/api/proxy/manga",
    navItems: [
      { label: "Dashboard", icon: MdDashboard, id: "dashboard" },
      { label: "Manga", icon: MdMenuBook, id: "manga" },
      { label: "Genres", icon: MdCategory, id: "genres" },
      { label: "Bookmarks", icon: MdBookmark, id: "bookmarks" },
      { label: "Settings", icon: MdSettings, id: "settings" },
    ],
  },
];
