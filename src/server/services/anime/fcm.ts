import * as admin from "firebase-admin";
import { getFirebaseApp } from "@/server/firebase";
import type { EpisodeItem } from "@/server/scrapers/gogo-scraper";
import * as blockedCountries from "./blocked-countries";
import { allCountries, addCountry } from "./countries-registry";

const TOPIC_ALL = "anime_new";
const topicForCountry = (cc: string) => `anime_new_${cc.toUpperCase()}`;
const ANDROID_CLICK_ACTION = "com.myAllVideoBrowser.OPEN_URL";
const ANDROID_CHANNEL_ALERT = "anime_new";
const ANDROID_CHANNEL_SILENT = "anime_new_silent";

export async function subscribeToCountry(
  token: string,
  country?: string
): Promise<{ topics: string[]; blocked: boolean; fcmEnabled: boolean }> {
  const cc = country && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : undefined;

  if (cc && (await blockedCountries.isBlocked(cc))) {
    return { topics: [], blocked: true, fcmEnabled: !!getFirebaseApp() };
  }

  const topics = cc ? [topicForCountry(cc)] : [TOPIC_ALL];

  if (cc) await addCountry(cc);

  const app = getFirebaseApp();
  if (!app) {
    console.warn(`[fcm] [dry-run] would subscribe token to topics ${topics.join(", ")}`);
    return { topics, blocked: false, fcmEnabled: false };
  }

  const messaging = admin.messaging(app);
  await Promise.all(topics.map((t) => messaging.subscribeToTopic([token], t)));
  return { topics, blocked: false, fcmEnabled: true };
}

export async function publishEpisode(
  item: EpisodeItem,
  topic: string = TOPIC_ALL,
  silent = false
): Promise<string> {
  const channelId = silent ? ANDROID_CHANNEL_SILENT : ANDROID_CHANNEL_ALERT;
  const payload: admin.messaging.Message = {
    topic,
    notification: {
      title: item.animeName,
      body: item.episode ? `Watch ${item.episode}` : "New release",
      imageUrl: item.thumbnail,
    },
    data: {
      url: item.url,
      animeName: item.animeName,
      episode: item.episode ?? "",
      type: item.type ?? "",
      silent: silent ? "1" : "0",
    },
    android: {
      priority: "high",
      notification: {
        clickAction: ANDROID_CLICK_ACTION,
        channelId,
        priority: silent ? "low" : "high",
        defaultSound: !silent,
        defaultVibrateTimings: !silent,
      },
    },
  };

  const app = getFirebaseApp();
  if (!app) {
    console.log(`[fcm] [dry-run] publish ${item.title} -> ${topic} (${silent ? "silent" : "alert"})`);
    return "dry-run";
  }
  return admin.messaging(app).send(payload);
}

export async function publishEpisodeFanout(
  item: EpisodeItem,
  silent = false
): Promise<{ total: number; failed: number; topics: string[] }> {
  const countries = await allCountries();
  const countryTopics: string[] = [];
  for (const cc of countries) {
    if (!(await blockedCountries.isBlocked(cc))) {
      countryTopics.push(topicForCountry(cc));
    }
  }

  const targets = [TOPIC_ALL, ...countryTopics];
  const results = await Promise.allSettled(
    targets.map((topic) => publishEpisode(item, topic, silent))
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  return { total: targets.length, failed, topics: targets };
}
