import { fetchHomepage } from "@/server/scrapers/gogo-scraper";
import { diff } from "./diff";
import { publishEpisodeFanout } from "./fcm";

const MAX_NOTIFICATIONS_PER_BATCH = 5;
let running = false;

export async function runOnce(): Promise<void> {
  if (running) {
    console.log("[poller] previous tick still running — skipping");
    return;
  }
  running = true;
  try {
    const items = await fetchHomepage();
    if (items.length === 0) {
      console.warn("[poller] Scraper returned 0 items — selectors may have changed");
      return;
    }

    const fresh = await diff(items);
    if (fresh.length === 0) return;

    const limited = fresh.slice(0, MAX_NOTIFICATIONS_PER_BATCH);
    const skipped = fresh.length - limited.length;
    console.log(
      `[poller] ${fresh.length} new episode(s) — publishing ${limited.length}` +
        (skipped > 0 ? ` (skipping ${skipped})` : "")
    );

    for (let i = 0; i < limited.length; i++) {
      const item = limited[i];
      const silent = i > 0;
      try {
        const result = await publishEpisodeFanout(item, silent);
        console.log(
          `[poller] published ${item.url} (${silent ? "silent" : "alert"}) → ${result.topics.length} topic(s)` +
            (result.failed > 0 ? ` (${result.failed} failed)` : "")
        );
      } catch (e) {
        console.error(`[poller] publish failed for ${item.url}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    console.error(`[poller] poll tick failed: ${(e as Error).message}`);
  } finally {
    running = false;
  }
}
