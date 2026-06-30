import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const DB_CONFIG = {
  host: "194.163.133.119",
  port: 3306,
  user: "chinese_drama",
  password: "asd1236547899",
  database: "chinese_drama",
  charset: "utf8mb4",
};

const IMAGEBAN_KEY = "HcllsPjSpOCGg9DMHzQaDeT3IXO2LAStS4c";

// All dramas from genre page agents
const GENRE_DRAMAS = [
  // === Strong Female Lead (249) ===
  { bookId: "42000018544", slug: "twin-trap-i-played-the-billionaire-twin-heirs", title: "Twin Trap: I Played the Billionaire Twin Heirs", episodes: 45, genre: "Strong Female Lead" },
  { bookId: "42000018443", slug: "pregnant-by-me-im-a-girl", title: "Pregnant by Me? I'm a Girl", episodes: 60, genre: "Strong Female Lead" },
  { bookId: "42000018328", slug: "sister-by-name-guardian-by-choice", title: "Sister by Name, Guardian by Choice", episodes: 61, genre: "Strong Female Lead" },
  { bookId: "42000017925", slug: "outsmarting-my-murderous--best-friend", title: "Outsmarting My Murderous Best Friend", episodes: 50, genre: "Strong Female Lead" },
  { bookId: "42000017997", slug: "idonteattrashhesallyoursdubbed", title: "I Don't Eat Trash, He's All Yours (DUBBED)", episodes: 53, genre: "Strong Female Lead" },
  { bookId: "42000017510", slug: "ex-husband-stole-my-daughters-cure-regretted-knowing-im-the-elven-queen", title: "Ex-husband Stole My Daughter's Cure, Regretted Knowing I'm The Elven Queen", episodes: 45, genre: "Strong Female Lead" },
  { bookId: "42000017766", slug: "hidden-survivors", title: "Hidden Survivors", episodes: 30, genre: "Strong Female Lead" },
  { bookId: "42000017739", slug: "still-you-always-you", title: "Still You Always You", episodes: 67, genre: "Strong Female Lead" },
  { bookId: "42000016922", slug: "revenge-queens-kick-back", title: "Revenge Queens Kick Back", episodes: 64, genre: "Strong Female Lead" },
  { bookId: "42000016919", slug: "the-queen-takes-both", title: "The Queen Takes Both", episodes: 61, genre: "Strong Female Lead" },
  { bookId: "42000016900", slug: "freedom-after-goodbye", title: "Freedom After Goodbye", episodes: 56, genre: "Strong Female Lead" },
  { bookId: "42000016912", slug: "evil-stepmom-survival-guide", title: "Evil Stepmom Survival Guide", episodes: 59, genre: "Strong Female Lead" },

  // === Romance (161) ===
  { bookId: "42000018879", slug: "his-final-heartbeat-her-eternal-regret", title: "His Final Heartbeat, Her Eternal Regret", episodes: 39, genre: "Romance" },
  { bookId: "42000018798", slug: "under-the-spotlight-across-the-screen", title: "Under the Spotlight, Across the Screen", episodes: 30, genre: "Romance" },
  { bookId: "42000018783", slug: "cruel-fate-boundless-love", title: "Cruel Fate, Boundless Love", episodes: 76, genre: "Romance" },
  { bookId: "42000014986", slug: "someone-you-loved", title: "Someone You Loved", episodes: 27, genre: "Romance" },
  { bookId: "42000018471", slug: "second-chance-with-the-fire-chief", title: "Second Chance with the Fire Chief", episodes: 67, genre: "Romance" },
  { bookId: "42000018661", slug: "the-farewell-written-in-ashes", title: "The Farewell Written in Ashes", episodes: 60, genre: "Romance" },
  { bookId: "42000018036", slug: "his-silent-possession", title: "His Silent Possession", episodes: 50, genre: "Romance" },
  { bookId: "42000018482", slug: "four-times-the-love-four-times-the-trouble", title: "Four Times the Love, Four Times the Trouble", episodes: 92, genre: "Romance" },
  { bookId: "42000018250", slug: "the-secret-diary-of-loving-you", title: "The Secret Diary of Loving You", episodes: 80, genre: "Romance" },
  { bookId: "42000018467", slug: "the-wrong-one-night", title: "The Wrong One Night", episodes: 63, genre: "Romance" },
  { bookId: "42000018109", slug: "our-hearts-in-disguise-a-sweet-game-of-love", title: "Our Hearts in Disguise: A Sweet Game of Love", episodes: 100, genre: "Romance" },
  { bookId: "42000018553", slug: "out-of-forgiveness-out-of-love", title: "Out of Forgiveness, Out of Love", episodes: 51, genre: "Romance" },

  // === CEO (269) ===
  { bookId: "42000018470", slug: "done-playing-nice--the-boss-is-back", title: "Done Playing Nice, The Boss Is Back", episodes: 44, genre: "CEO" },
  { bookId: "42000017031", slug: "surrogate-for-my-exs-billionaire-uncle", title: "Surrogate For My Ex's Billionaire Uncle", episodes: 64, genre: "CEO" },
  { bookId: "42000017771", slug: "the-boss-hidden-affection", title: "The Boss Hidden Affection", episodes: 30, genre: "CEO" },
  { bookId: "42000016913", slug: "catch-me-if-you-can", title: "Catch Me If You Can", episodes: 63, genre: "CEO" },
  { bookId: "42000016908", slug: "rumor-has-it", title: "Rumor Has It", episodes: 50, genre: "CEO" },
  { bookId: "42000015389", slug: "my-ceo-loves-my-voice", title: "My CEO Loves My Voice", episodes: 52, genre: "CEO" },
  { bookId: "42000014454", slug: "the-dangerous-heir", title: "The Dangerous Heir", episodes: 61, genre: "CEO" },
  { bookId: "41000105230", slug: "loves-second-chance", title: "Love's Second Chance", episodes: 106, genre: "CEO" },
  { bookId: "42000014200", slug: "my-poor-husband-is-a-big-shot", title: "My Poor Husband Is A Big Shot", episodes: 59, genre: "CEO" },
  { bookId: "41000110833", slug: "reaping-what-they-sow", title: "Reaping What They Sow", episodes: 30, genre: "CEO" },

  // === Revenge (260) ===
  { bookId: "42000018871", slug: "back-as-a-mosquito-out-for-blood", title: "Back as a Mosquito, Out for Blood", episodes: 69, genre: "Revenge" },
  { bookId: "42000018868", slug: "the-troublemaker-who-turned-the-tables", title: "The Troublemaker Who Turned the Tables", episodes: 79, genre: "Revenge" },
  { bookId: "42000018873", slug: "stepmothers-revenge-snaring-the-billionaires-heart", title: "Stepmother's Revenge: Snaring the Billionaire's Heart", episodes: 63, genre: "Revenge" },
  { bookId: "42000017044", slug: "all-for-the-winner", title: "All For The Winner", episodes: 57, genre: "Revenge" },
  { bookId: "42000018799", slug: "the-condemned-bloodforged-reckoning", title: "The Condemned: Bloodforged Reckoning", episodes: 80, genre: "Revenge" },
  { bookId: "42000018819", slug: "fall-of-the-gods-the-sword-that-defies-heaven", title: "Fall of the Gods: The Sword That Defies Heaven", episodes: 72, genre: "Revenge" },
  { bookId: "42000018780", slug: "the-legend-returns-touch-my-daughter-pay-in-blood", title: "The Legend Returns: Touch My Daughter, Pay in Blood", episodes: 89, genre: "Revenge" },
  { bookId: "42000018772", slug: "the-boss-awakens-return-of-the-legend", title: "The Boss Awakens: Return of the Legend", episodes: 88, genre: "Revenge" },
  { bookId: "42000018753", slug: "blueprint-for-revenge-design-your-doom", title: "Blueprint for Revenge, Design Your Doom", episodes: 35, genre: "Revenge" },
  { bookId: "42000017957", slug: "trade-lives-watch-me-rise-again", title: "Trade Lives? Watch Me Rise Again", episodes: 59, genre: "Revenge" },
  { bookId: "42000018513", slug: "reborn-to-revenge-destined-to-love", title: "Reborn to Revenge, Destined to Love", episodes: 60, genre: "Revenge" },

  // === Fantasy (204) ===
  { bookId: "42000017962", slug: "the-border-kingdoms-divine-healer", title: "The Border Kingdom's Divine Healer", episodes: 60, genre: "Fantasy" },
  { bookId: "42000018526", slug: "three-wild-cats-of-the-farmer", title: "Three Wild Cats of The Farmer", episodes: 50, genre: "Fantasy" },
  { bookId: "42000018622", slug: "school-belles-dragon-devour-evolve-get-revenge", title: "School Belle's Dragon: Devour, Evolve, Get Revenge", episodes: 70, genre: "Fantasy" },
  { bookId: "42000017032", slug: "destined-for-alpha", title: "Destined for Alpha", episodes: 60, genre: "Fantasy" },
  { bookId: "42000017740", slug: "feed-me-my-double-cursed-alpha", title: "Feed Me, My Double-Cursed Alpha", episodes: 41, genre: "Fantasy" },
  { bookId: "42000017741", slug: "beneath-the-white-fur-the-divine-beast-awakens", title: "Beneath the White Fur, the Divine Beast Awakens", episodes: 42, genre: "Fantasy" },
  { bookId: "42000017941", slug: "supreme-dominance-the-beauty-binding-system", title: "Supreme Dominance: The Beauty Binding System", episodes: 66, genre: "Fantasy" },
  { bookId: "42000016950", slug: "midnight-pulse-the-veined-oath", title: "Midnight Pulse: The Veined Oath", episodes: 60, genre: "Fantasy" },
  { bookId: "42000016199", slug: "born-to-devour-destined-to-rule", title: "Born to Devour, Destined to Rule", episodes: 78, genre: "Fantasy" },
  { bookId: "42000017613", slug: "high-card-hustle", title: "High Card Hustle", episodes: 53, genre: "Fantasy" },
  { bookId: "42000016645", slug: "world-goes-under-empire-rises-up", title: "World Goes Under, Empire Rises Up", episodes: 87, genre: "Fantasy" },

  // === Werewolves (534) ===
  { bookId: "42000013258", slug: "marry-vampire-king-after-rebirth", title: "Marry Vampire King After Rebirth", episodes: 33, genre: "Werewolves" },
  { bookId: "42000012531", slug: "my-cold-blooded-alpha-king", title: "My Cold Blooded Alpha King", episodes: 62, genre: "Werewolves" },
  { bookId: "42000009950", slug: "my-fated-mate-is-the-bloodline-key", title: "My Fated Mate is the Bloodline Key", episodes: 58, genre: "Werewolves" },
  { bookId: "42000007430", slug: "destined-to-three-alphas", title: "Destined to Three Alphas", episodes: 50, genre: "Werewolves" },
  { bookId: "42000004305", slug: "my--gigolo--alpha", title: 'My "Gigolo" Alpha', episodes: 74, genre: "Werewolves" },
  { bookId: "42000001292", slug: "what-exactly-lies-in-the-dance-studio", title: "What Exactly Lies in the Dance Studio", episodes: 48, genre: "Werewolves" },
  { bookId: "41000123217", slug: "the-alpha-kings-true-luna", title: "The Alpha King's True Luna", episodes: 49, genre: "Werewolves" },
  { bookId: "41000122439", slug: "married-but-available-perfume-and-moon", title: "Married But Available: Perfume And Moon", episodes: 80, genre: "Werewolves" },
  { bookId: "41000121954", slug: "the-scent-of--my-fated-luna", title: "The Scent of My Fated Luna", episodes: 46, genre: "Werewolves" },
  { bookId: "41000119996", slug: "married-to-the-secret-lycan-king", title: "Married to the Secret Lycan King", episodes: 58, genre: "Werewolves" },
  { bookId: "41000117514", slug: "the-rejected-alpha-queen-comes-back", title: "The Rejected Alpha Queen Comes Back", episodes: 54, genre: "Werewolves" },

  // === Suspense (264) ===
  { bookId: "42000017036", slug: "turn-left-to-mrright", title: "Turn Left to Mr.Right", episodes: 58, genre: "Suspense" },
  { bookId: "42000004535", slug: "my-prime-suspect-lady", title: "My Prime Suspect Lady", episodes: 30, genre: "Suspense" },

  // === Family (498) ===
  { bookId: "42000018735", slug: "oops-i-married-the-wrong-husband", title: "Oops, I Married the Wrong Husband", episodes: 77, genre: "Family" },
  { bookId: "42000016641", slug: "home-within-reach-hearts-out-of-reach", title: "Home Within Reach, Hearts Out of Reach", episodes: 60, genre: "Family" },
  { bookId: "42000015332", slug: "the-mute-brother--loudmouth-siste", title: "The Mute Brother & Loudmouth Sister", episodes: 60, genre: "Family" },
  { bookId: "42000012890", slug: "believe-me-or-we-all-die-twice", title: "Believe Me, or We All Die Twice", episodes: 71, genre: "Family" },
  { bookId: "42000012855", slug: "bite-the-hand-get-the-slap", title: "Bite the Hand, Get the Slap", episodes: 45, genre: "Family" },
  { bookId: "42000011367", slug: "oops-my-kid-is-cupid", title: "Oops! My Kid Is Cupid", episodes: 55, genre: "Family" },
  { bookId: "42000011921", slug: "rewinding-1988-her-youth-my-journey", title: "Rewinding 1988: Her Youth, My Journey", episodes: 60, genre: "Family" },
  { bookId: "42000011659", slug: "the-sister-she-has-never-seen", title: "The Sister She Has Never Seen", episodes: 57, genre: "Family" },
  { bookId: "42000011582", slug: "my-seven-sons-turned-into-enemies", title: "My Seven Sons Turned into Enemies", episodes: 55, genre: "Family" },
  { bookId: "42000011196", slug: "winners-payback-rise-from-dirt", title: "Winner's Payback, Rise From Dirt", episodes: 59, genre: "Family" },
  { bookId: "42000009569", slug: "the-stolen-lifetrue-heiress-returns", title: "The Stolen Life: True Heiress Returns", episodes: 58, genre: "Family" },

  // === Marriage (250) ===
  { bookId: "42000016918", slug: "runway-to-my-heart", title: "Runway To My Heart", episodes: 54, genre: "Marriage" },
  { bookId: "42000010638", slug: "country-heartthrob", title: "Country Heartthrob", episodes: 37, genre: "Marriage" },
  { bookId: "42000012519", slug: "the-devil-dragons-substitute-bride", title: "The Devil Dragon's Substitute Bride", episodes: 52, genre: "Marriage" },
  { bookId: "42000012534", slug: "fall-into-sweet-trap", title: "Fall Into Sweet Trap", episodes: 65, genre: "Marriage" },
  { bookId: "42000010613", slug: "my-dear-doctor-please-be-gentle-with-me", title: "My Dear Doctor, Please Be Gentle with Me", episodes: 50, genre: "Marriage" },
  { bookId: "42000005911", slug: "the-princes-ugly-bride", title: "The Prince's Ugly Bride", episodes: 55, genre: "Marriage" },
  { bookId: "42000005789", slug: "my-last-divorce-my-first-love", title: "My Last Divorce, My First Love", episodes: 81, genre: "Marriage" },
  { bookId: "42000005802", slug: "dont-mess-with-tycoons-mom", title: "Don't Mess with Tycoons' Mom", episodes: 54, genre: "Marriage" },
  { bookId: "42000005914", slug: "after-breakup-he-proposes", title: "After Breakup, He Proposes", episodes: 56, genre: "Marriage" },
  { bookId: "42000005927", slug: "chatterbox-sweetheart-and-silent-ceo", title: "Chatterbox Sweetheart and Silent CEO", episodes: 60, genre: "Marriage" },
  { bookId: "42000005276", slug: "my-quarterback-ex-is-begging-me-back", title: "My Quarterback Ex Is Begging Me Back", episodes: 54, genre: "Marriage" },
  { bookId: "42000004539", slug: "after-all-this-time", title: "After All This Time", episodes: 50, genre: "Marriage" },

  // === Enemies to Lovers (267) ===
  { bookId: "42000017037", slug: "coaching-my-heart-at-200-mph", title: "Coaching My Heart at 200 MPH", episodes: 52, genre: "Enemies to Lovers" },
  { bookId: "42000017075", slug: "the-taming-game", title: "The Taming Game", episodes: 68, genre: "Enemies to Lovers" },
  { bookId: "42000016627", slug: "coaching-my-bad-boy-roommate", title: "Coaching My Bad Boy Roommate", episodes: 57, genre: "Enemies to Lovers" },
  { bookId: "42000014119", slug: "bullies-and-me", title: "Bullies and Me", episodes: 74, genre: "Enemies to Lovers" },
  { bookId: "42000013017", slug: "sapphire-in-the-wasteland", title: "Sapphire in the Wasteland", episodes: 35, genre: "Enemies to Lovers" },
  { bookId: "42000012856", slug: "roommate-benefits-the-governors-son", title: "Roommate Benefits: The Governor's Son", episodes: 62, genre: "Enemies to Lovers" },
  { bookId: "42000014022", slug: "wild-ride-with-my-stepbrother", title: "Wild Ride With My Stepbrother", episodes: 40, genre: "Enemies to Lovers" },
  { bookId: "42000008788", slug: "my-stepmothers-son", title: "My Stepmother's Son", episodes: 60, genre: "Enemies to Lovers" },
  { bookId: "42000008972", slug: "crush-alert-love-request-from-my-enemy", title: "Crush Alert! Love Request from My Enemy", episodes: 52, genre: "Enemies to Lovers" },

  // === Werewolf (274) ===
  { bookId: "42000017045", slug: "married-to-my-alpha-husband-by-contract", title: "Married to My Alpha Husband by Contract", episodes: 59, genre: "Werewolf" },
  { bookId: "42000017486", slug: "too-late-to-regret-your-disgrace-is-a-billion-dollar-genius", title: "Too Late to Regret Your Disgrace Is a Billion-Dollar Genius", episodes: 49, genre: "Werewolf" },
  { bookId: "42000016932", slug: "the-weak-ice-wolf-girl-who-became-dragon-queen", title: "The Weak Ice Wolf Girl Who Became Dragon Queen", episodes: 50, genre: "Werewolf" },
  { bookId: "42000016708", slug: "how-to-tame-a-cursed-alpha", title: "How to Tame a Cursed Alpha", episodes: 51, genre: "Werewolf" },
  { bookId: "42000011979", slug: "taming-the-school-heartthrob-my-bad-boy-stepbrother", title: "Taming the School Heartthrob: My Bad Boy Stepbrother", episodes: 39, genre: "Werewolf" },
  { bookId: "42000012501", slug: "alpha-is-not-my-type", title: "Alpha Is Not My Type", episodes: 39, genre: "Werewolf" },
  { bookId: "42000012532", slug: "tempting-luna-identity", title: "Tempting Luna Identity", episodes: 73, genre: "Werewolf" },
  { bookId: "42000012528", slug: "fated-by-moonlight-my-forbidden-stepmother", title: "Fated by Moonlight My Forbidden Stepmother", episodes: 70, genre: "Werewolf" },
  { bookId: "42000012559", slug: "how-i-became-the-alpha-queen", title: "How I Became the Alpha Queen", episodes: 45, genre: "Werewolf" },
  { bookId: "42000012556", slug: "mrsantai-want-you", title: "Mr.Santa, I Want You!", episodes: 65, genre: "Werewolf" },
  { bookId: "42000012381", slug: "my-forced-alpha-mate", title: "My Forced Alpha Mate", episodes: 32, genre: "Werewolf" },
  { bookId: "42000012550", slug: "forbidden-love-hes-my-brother", title: "Forbidden Love He's My Brother", episodes: 63, genre: "Werewolf" },
];

// Load Billionaire + Rebirth data from file
let billionaireRebirthData = [];
try {
  billionaireRebirthData = JSON.parse(readFileSync("/tmp/dramabox_combined.json", "utf-8"));
  // Normalize keys
  billionaireRebirthData = billionaireRebirthData.map((d) => ({
    bookId: String(d.bookId),
    slug: d.slug,
    title: d.title,
    episodes: d.episodes || d.chapterCount || 0,
    genre: d.genre,
  }));
} catch (e) {
  console.log("Could not load /tmp/dramabox_combined.json:", e.message);
}

function generateDramaId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function randomViews() {
  return Math.floor(Math.random() * 80000000) + 500000;
}

function randomRating() {
  return (Math.random() * 2.5 + 7.0).toFixed(1);
}

function buildCoverUrl(bookId) {
  const prefix = bookId.substring(0, 2);
  const p1 = `${prefix[0]}x${prefix[1]}`;
  const p2 = `${bookId.substring(0, 4).substring(0, 2)}x${bookId.substring(2, 4)}`;
  const p3 = `${bookId.substring(0, 3)}x${bookId.substring(3, 5)}`;
  if (bookId.startsWith("41")) {
    return `https://thwztchapter.dramaboxdb.com/data/cppartner/4x1/41x0/410x0/${bookId}/${bookId}.jpg`;
  }
  return `https://thwztchapter.dramaboxdb.com/data/cppartner/4x2/42x0/420x0/${bookId}/${bookId}.jpg`;
}

function buildSourceUrl(bookId, slug) {
  return `https://www.dramaboxdb.com/movie/${bookId}/${slug}`;
}

async function uploadToImageBan(imageUrl) {
  try {
    const highResUrl = imageUrl.replace(/@w=\d+&h=\d+/, "") + "@w=480&h=720";
    const imgRes = await fetch(highResUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!imgRes.ok) return null;

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const base64 = buffer.toString("base64");

    const form = new FormData();
    form.append("image", base64);

    const uploadRes = await fetch("https://api.imageban.ru/v1", {
      method: "POST",
      headers: { Authorization: `Bearer ${IMAGEBAN_KEY}` },
      body: form,
    });

    const data = await uploadRes.json();
    if (data.success && data.data?.link) return data.data.link;
    return null;
  } catch {
    return null;
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("=== Bulk Drama Seeder ===\n");

  // Combine all sources
  const allDramas = [...GENRE_DRAMAS, ...billionaireRebirthData];
  console.log(`Total raw entries: ${allDramas.length}`);

  // Deduplicate by bookId, collecting all genres per drama
  const dramaMap = new Map();
  for (const d of allDramas) {
    const id = String(d.bookId);
    if (dramaMap.has(id)) {
      const existing = dramaMap.get(id);
      if (d.genre && !existing.genres.includes(d.genre)) {
        existing.genres.push(d.genre);
      }
    } else {
      dramaMap.set(id, {
        bookId: id,
        slug: d.slug,
        title: d.title,
        episodes: d.episodes || 0,
        genres: d.genre ? [d.genre] : [],
      });
    }
  }

  console.log(`Unique dramas: ${dramaMap.size}`);

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log("Connected to MySQL\n");

  // Get existing dramas to skip duplicates
  const [existingDramas] = await conn.execute("SELECT drama_id, name FROM dramas");
  const existingIds = new Set(existingDramas.map((d) => d.drama_id));
  const existingNames = new Set(existingDramas.map((d) => d.name.toLowerCase()));
  console.log(`Existing dramas in DB: ${existingIds.size}`);

  // Get/create genres
  const [existingGenres] = await conn.execute("SELECT id, slug, name FROM genres");
  const genreMap = new Map();
  for (const g of existingGenres) {
    genreMap.set(g.slug, g.id);
    genreMap.set(g.name.toLowerCase(), g.id);
  }

  // Merge Werewolves and Werewolf into one genre
  const GENRE_ALIASES = {
    Werewolves: "Werewolf",
  };

  async function ensureGenre(name) {
    const resolvedName = GENRE_ALIASES[name] || name;
    const slug = resolvedName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    let id = genreMap.get(slug) || genreMap.get(resolvedName.toLowerCase());
    if (!id) {
      const [result] = await conn.execute(
        "INSERT INTO genres (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
        [resolvedName, slug]
      );
      id = result.insertId;
      genreMap.set(slug, id);
      genreMap.set(resolvedName.toLowerCase(), id);
      console.log(`  Created genre: ${resolvedName} (id=${id})`);
    }
    return id;
  }

  // Process dramas
  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  const entries = Array.from(dramaMap.values());

  for (let i = 0; i < entries.length; i++) {
    const d = entries[i];
    const dramaId = generateDramaId(d.title);

    // Skip if already exists
    if (existingIds.has(dramaId) || existingNames.has(d.title.toLowerCase())) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${entries.length}] ${d.title.substring(0, 50)}...`);

    try {
      // Upload poster to ImageBan
      const coverUrl = buildCoverUrl(d.bookId);
      let imageBanUrl = null;

      await sleep(800); // Rate limit
      imageBanUrl = await uploadToImageBan(coverUrl);

      const sourceUrl = buildSourceUrl(d.bookId, d.slug);
      const views = randomViews();
      const rating = randomRating();

      const [insertResult] = await conn.execute(
        `INSERT INTO dramas (drama_id, name, original_name, description, type, origin, language, rating, episode_count, small_poster, large_poster, collection_source, all_time_watch_count)
         VALUES (?, ?, ?, ?, 'short_drama', 'chinese', 'subbed', ?, ?, ?, ?, ?, ?)`,
        [
          dramaId,
          d.title,
          d.title,
          null,
          rating,
          d.episodes,
          imageBanUrl || coverUrl + "@w=480&h=720",
          imageBanUrl || coverUrl + "@w=480&h=720",
          sourceUrl,
          views,
        ]
      );

      const sno = insertResult.insertId;

      // Link genres
      for (const genreName of d.genres) {
        const genreId = await ensureGenre(genreName);
        await conn.execute(
          "INSERT IGNORE INTO drama_genres (drama_sno, genre_id) VALUES (?, ?)",
          [sno, genreId]
        );
      }

      existingIds.add(dramaId);
      existingNames.add(d.title.toLowerCase());
      inserted++;
      console.log(` OK (poster=${imageBanUrl ? "ImageBan" : "direct"})`);
    } catch (e) {
      console.log(` FAIL: ${e.message}`);
      failed++;
    }
  }

  // Print summary
  console.log(`\n=== DONE ===`);
  console.log(`Inserted: ${inserted}, Skipped (duplicate): ${skipped}, Failed: ${failed}`);

  // Genre stats
  const [genreStats] = await conn.execute(`
    SELECT g.name, COUNT(dg.drama_sno) as cnt
    FROM genres g
    LEFT JOIN drama_genres dg ON g.id = dg.genre_id
    GROUP BY g.id
    ORDER BY cnt DESC
  `);
  console.log("\nGenre distribution:");
  for (const g of genreStats) {
    console.log(`  ${g.name}: ${g.cnt} dramas`);
  }

  const [totalDramas] = await conn.execute("SELECT COUNT(*) as c FROM dramas");
  console.log(`\nTotal dramas in DB: ${totalDramas[0].c}`);

  await conn.end();
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
