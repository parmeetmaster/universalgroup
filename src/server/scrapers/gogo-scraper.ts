import * as cheerio from "cheerio";

export interface EpisodeItem {
  url: string;
  title: string;
  animeName: string;
  episode: string;
  thumbnail?: string;
  type?: string;
}

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function fetchHomepage(): Promise<EpisodeItem[]> {
  const baseUrl = process.env.GOGO_BASE_URL || "https://gogoanimes.cv/";
  const res = await fetch(baseUrl, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`gogoanimes returned HTTP ${res.status}`);
  const html = await res.text();
  return parseHomepage(html);
}

export function parseHomepage(html: string): EpisodeItem[] {
  const $ = cheerio.load(html);
  const items: EpisodeItem[] = [];

  $("ul.items#anime-list > li, div.last_episodes ul.items > li").each((_, li) => {
    const $li = $(li);
    const anchor = $li.find(".img a").first();
    const url = anchor.attr("href")?.trim();
    const title = anchor.attr("title")?.trim();
    if (!url || !title) return;

    const animeName = $li.find("p.name a").first().text().trim() || title;
    const episode = $li.find("p.episode").first().text().trim();
    const thumbnail = $li.find(".img img").first().attr("src")?.trim();
    const typeClass = $li.find(".img .type").first().attr("class") ?? "";
    const typeMatch = typeClass.match(/ic-([A-Z]+)/);
    const type = typeMatch ? typeMatch[1] : undefined;

    items.push({ url, title, animeName, episode, thumbnail, type });
  });

  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.url) ? false : (seen.add(i.url), true)));
}
