import * as cheerio from "cheerio";
import type { Element } from "domhandler";

const BASE_URL = "https://aviationa2z.com";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAX_RETRIES = 2;

// --------------- interfaces ---------------

export interface ArticleMinimal {
  title: string;
  url: string;
  image?: string;
  date?: string;
}

export interface ArticleCard {
  title: string;
  url: string;
  image: string;
  category: string;
  date: string;
}

export interface ArticleSummary {
  title: string;
  url: string;
  image: string;
  category: string;
  author: string;
  date: string;
  excerpt: string;
}

export interface ArticleDetail {
  title: string;
  url: string;
  image: string;
  category: string;
  author: string;
  date: string;
  content: string;
  excerpt: string;
  tags: string[];
  related: ArticleMinimal[];
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedArticles {
  articles: ArticleSummary[];
  pagination: Pagination;
}

export interface HomePageData {
  hero: ArticleCard | null;
  trending: ArticleCard[];
  latestNews: ArticleSummary[];
  featured: ArticleCard[];
  editorsChoice: ArticleCard[];
  aerospace: ArticleCard[];
  airlines: ArticleCard[];
  airport: ArticleCard[];
  exclusiveBlogs: ArticleCard[];
  popularBlogs: ArticleCard[];
  editorsPicks: ArticleCard[];
  sidebar: ArticleMinimal[];
  footer: ArticleMinimal[];
}

// --------------- helpers ---------------

export function buildPagination(page: number, totalPages: number): Pagination {
  return {
    currentPage: page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

function resolveUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return url.startsWith("/") ? `${BASE_URL}${url}` : `${BASE_URL}/${url}`;
}

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,*/*",
          ...options?.headers,
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) return res;
      if (attempt === retries) return res;
    } catch (err) {
      if (attempt === retries) throw err;
    }
  }
  throw new Error("fetchWithRetry: unreachable");
}

function extractImage($el: cheerio.Cheerio<Element>): string {
  const bgSrc = $el.find("span.img[data-bgsrc]").attr("data-bgsrc");
  if (bgSrc) return resolveUrl(bgSrc);

  const dataSrc = $el.find("img[data-src]").first().attr("data-src");
  if (dataSrc) return resolveUrl(dataSrc);

  const src = $el.find("img[src]").first().attr("src");
  return resolveUrl(src);
}

function parseTotalPages($: cheerio.CheerioAPI): number {
  const lastPageLink = $("a.page-numbers").last().attr("href");
  if (!lastPageLink) return 1;
  const match = lastPageLink.match(/\/page\/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

// --------------- content sanitizer ---------------

export function sanitizeContentForFlutter(html: string): string {
  const $ = cheerio.load(html);

  $("script, style, iframe, noscript").remove();
  $(".adsbygoogle, .ads, .ad-wrapper, .social-share, .social-widget, .sharedaddy").remove();
  $("[id*='ad-'], [class*='ad-container'], [class*='advert']").remove();

  $("*").each((_, el) => {
    const elem = $(el);
    const attrs = (el as Element).attribs || {};
    for (const attr of Object.keys(attrs)) {
      if (attr.startsWith("data-")) {
        elem.removeAttr(attr);
      }
    }
    elem.removeAttr("onclick");
    elem.removeAttr("onload");
    elem.removeAttr("onerror");
  });

  return $.html()?.trim() || "";
}

// --------------- parsers ---------------

function parseArticleCard(
  $el: cheerio.Cheerio<Element>,
): ArticleCard {
  const titleEl = $el.find(".post-title a, h2 a, h3 a").first();
  return {
    title: titleEl.text().trim(),
    url: resolveUrl(titleEl.attr("href")),
    image: extractImage($el),
    category: $el.find(".post-cat, .category, .cat-label").first().text().trim(),
    date: $el.find("time, .post-date, .date").first().text().trim(),
  };
}

function parseArticleSummary(
  $el: cheerio.Cheerio<Element>,
): ArticleSummary {
  const titleEl = $el.find(".post-title a, h2 a, h3 a").first();
  return {
    title: titleEl.text().trim(),
    url: resolveUrl(titleEl.attr("href")),
    image: extractImage($el),
    category: $el.find(".post-cat, .category, .cat-label").first().text().trim(),
    author: $el.find(".post-author, .author, .meta-author a").first().text().trim(),
    date: $el.find("time, .post-date, .date").first().text().trim(),
    excerpt: $el.find(".post-excerpt, .excerpt, p").first().text().trim(),
  };
}

function parseArticleMinimal(
  $el: cheerio.Cheerio<Element>,
): ArticleMinimal {
  const titleEl = $el.find("a").first();
  return {
    title: titleEl.text().trim(),
    url: resolveUrl(titleEl.attr("href")),
    image: extractImage($el),
    date: $el.find("time, .post-date, .date").first().text().trim(),
  };
}

function parseListPage($: cheerio.CheerioAPI, page: number): PaginatedArticles {
  const articles: ArticleSummary[] = [];
  $("article.l-post").each((_, el) => {
    const article = parseArticleSummary($(el));
    if (article.title) articles.push(article);
  });
  const totalPages = parseTotalPages($);
  return { articles, pagination: buildPagination(page, totalPages) };
}

// --------------- section matcher for homepage ---------------

function matchSection(headText: string): keyof HomePageData | null {
  const t = headText.toLowerCase();
  if (t.includes("trending")) return "trending";
  if (t.includes("latest news")) return "latestNews";
  if (t.includes("featured")) return "featured";
  if (t.includes("editors choice") || t.includes("editor's choice")) return "editorsChoice";
  if (t.includes("aerospace")) return "aerospace";
  if (t.includes("airlines")) return "airlines";
  if (t.includes("airport")) return "airport";
  if (t.includes("exclusive blogs")) return "exclusiveBlogs";
  if (t.includes("popular blogs")) return "popularBlogs";
  if (t.includes("editors picks") || t.includes("editor's picks")) return "editorsPicks";
  return null;
}

// --------------- public scraping functions ---------------

export async function scrapeHome(): Promise<HomePageData> {
  const res = await fetchWithRetry(BASE_URL);
  if (!res.ok) throw new Error(`Failed to scrape home: HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const data: HomePageData = {
    hero: null,
    trending: [],
    latestNews: [],
    featured: [],
    editorsChoice: [],
    aerospace: [],
    airlines: [],
    airport: [],
    exclusiveBlogs: [],
    popularBlogs: [],
    editorsPicks: [],
    sidebar: [],
    footer: [],
  };

  // Hero
  const heroEl = $("article.grid-overlay").first();
  if (heroEl.length) {
    data.hero = parseArticleCard(heroEl);
  }

  // Sections
  $("section.block-wrap").each((_, section) => {
    const $section = $(section);
    const headText = $section.find(".block-head").text().trim();
    const key = matchSection(headText);
    if (!key) return;

    if (key === "latestNews") {
      $section.find("article.l-post, article").each((_, el) => {
        const article = parseArticleSummary($(el));
        if (article.title) (data[key] as ArticleSummary[]).push(article);
      });
    } else {
      $section.find("article").each((_, el) => {
        const card = parseArticleCard($(el));
        if (card.title) (data[key] as ArticleCard[]).push(card);
      });
    }
  });

  // Sidebar
  $(".sidebar .widget li, aside .widget li").each((_, el) => {
    const item = parseArticleMinimal($(el));
    if (item.title) data.sidebar.push(item);
  });

  // Footer
  $("footer .widget li, .footer-widgets li").each((_, el) => {
    const item = parseArticleMinimal($(el));
    if (item.title) data.footer.push(item);
  });

  return data;
}

export async function scrapeCategory(
  slug: string,
  page: number = 1
): Promise<PaginatedArticles> {
  const url = page > 1
    ? `${BASE_URL}/category/${slug}/page/${page}/`
    : `${BASE_URL}/category/${slug}/`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Failed to scrape category ${slug}: HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  return parseListPage($, page);
}

export async function scrapeArticle(path: string): Promise<ArticleDetail> {
  const url = resolveUrl(path);
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Failed to scrape article: HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $("h1.post-title").text().trim();
  const image = extractImage($("article").first());
  const category = $(".post-cat, .cat-label, .term-badge a").first().text().trim();
  const author = $(".post-author, .author-name a").first().text().trim();
  const date = $("article time, .post-date").first().text().trim();

  const contentEl = $(".entry-content").first();
  const rawContent = contentEl.html() || "";
  const content = sanitizeContentForFlutter(rawContent);
  const excerpt = contentEl.find("p").first().text().trim().slice(0, 300);

  const tags: string[] = [];
  $(".post-tags a, .tag-cloud a").each((_, el) => {
    const tag = $(el).text().trim();
    if (tag) tags.push(tag);
  });

  const related: ArticleMinimal[] = [];
  $(".related-posts article, .related-posts li").each((_, el) => {
    const item = parseArticleMinimal($(el));
    if (item.title) related.push(item);
  });

  return { title, url, image, category, author, date, content, excerpt, tags, related };
}

export async function scrapeSearch(
  query: string,
  page: number = 1
): Promise<PaginatedArticles> {
  const url = page > 1
    ? `${BASE_URL}/page/${page}/?s=${encodeURIComponent(query)}`
    : `${BASE_URL}/?s=${encodeURIComponent(query)}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Failed to scrape search: HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  return parseListPage($, page);
}

export async function scrapeAuthor(
  slug: string,
  page: number = 1
): Promise<PaginatedArticles> {
  const url = page > 1
    ? `${BASE_URL}/author/${slug}/page/${page}/`
    : `${BASE_URL}/author/${slug}/`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Failed to scrape author ${slug}: HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  return parseListPage($, page);
}

export async function scrapeTag(
  slug: string,
  page: number = 1
): Promise<PaginatedArticles> {
  const url = page > 1
    ? `${BASE_URL}/tag/${slug}/page/${page}/`
    : `${BASE_URL}/tag/${slug}/`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Failed to scrape tag ${slug}: HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  return parseListPage($, page);
}

export async function scrapeLatestPosts(
  page: number = 1
): Promise<PaginatedArticles> {
  const formData = new URLSearchParams();
  formData.append("action", "bunyad_block");
  formData.append("block", "highlights");
  formData.append("page", String(page));
  formData.append("atts[title]", "Latest News");
  formData.append("atts[sort_order]", "date");
  formData.append("atts[sort_by]", "modified");
  formData.append("atts[pagination]", "1");
  formData.append("atts[posts]", "10");

  const res = await fetchWithRetry(`${BASE_URL}/wp-admin/admin-ajax.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: BASE_URL,
      "X-Requested-With": "XMLHttpRequest",
    },
    body: formData.toString(),
  });
  if (!res.ok) throw new Error(`Failed to scrape latest posts: HTTP ${res.status}`);

  const json = await res.json();
  const htmlContent = json.html || json.data || "";
  const $ = cheerio.load(htmlContent);

  const articles: ArticleSummary[] = [];
  $("article.l-post, article").each((_, el) => {
    const article = parseArticleSummary($(el));
    if (article.title) articles.push(article);
  });

  const totalPages = json.total_pages || json.pages || Math.ceil((json.total || 0) / 10) || 1;
  return { articles, pagination: buildPagination(page, totalPages) };
}
