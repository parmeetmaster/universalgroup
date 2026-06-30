import mysql from "mysql2/promise";

const DB = { host: "194.163.133.119", port: 3306, user: "chinese_drama", password: "asd1236547899", database: "chinese_drama", charset: "utf8mb4" };
const IMAGEBAN_KEY = "HcllsPjSpOCGg9DMHzQaDeT3IXO2LAStS4c";

const ALL = [
  // Comedy
  {b:"42000005815",s:"python-attack-run",t:"Python Attack! Run!",e:53,g:"Comedy"},
  {b:"42000005372",s:"sorry-but-im-with-your-daddy",t:"Sorry, But I'm With Your Daddy",e:58,g:"Comedy"},
  {b:"42000004522",s:"supreme-god-of-army",t:"Supreme God of Army",e:42,g:"Comedy"},
  {b:"42000004542",s:"mrjohnstondont-torment-her",t:"Mr.Johnston, Don't Torment Her",e:74,g:"Comedy"},
  {b:"41000105061",s:"spoiled-by-my-step-brothers",t:"Spoiled by My Step Brothers",e:51,g:"Comedy"},
  {b:"41000104481",s:"the-heiress-and-her-three-princes",t:"The Heiress and Her Three Princes",e:51,g:"Comedy"},
  // Historical
  {b:"42000014514",s:"joseon-kings-return",t:"Joseon King's Return",e:60,g:"Historical"},
  {b:"41000117865",s:"he-who-shaped-the-empire",t:"He Who Shaped the Empire",e:80,g:"Historical"},
  {b:"41000117381",s:"he-who-rose-against-all",t:"He Who Rose Against All",e:90,g:"Historical"},
  {b:"41000109097",s:"throne-of-resolve",t:"Throne of Resolve",e:133,g:"Historical"},
  {b:"41000109375",s:"a-dance-of-steel-and-blood",t:"A Dance of Steel and Blood",e:72,g:"Historical"},
  {b:"41000109109",s:"return-of-his-majesty",t:"Return of His Majesty",e:63,g:"Historical"},
  {b:"41000107771",s:"the-chosen-blade-path-of-the-legend",t:"The Chosen Blade: Path of the Legend",e:91,g:"Historical"},
  {b:"41000107459",s:"the-wastrel-who-turned-into-a-legend",t:"The Wastrel Who Turned Into A Legend",e:93,g:"Historical"},
  {b:"41000106959",s:"the-time-bending-magistrate",t:"The Time-Bending Magistrate",e:95,g:"Historical"},
  {b:"41000106615",s:"legends-forged-his-time-traveling-odyssey",t:"Legends Forged: His Time-Traveling Odyssey",e:100,g:"Historical"},
  {b:"41000106624",s:"all-hail-the-prince-regent",t:"All Hail the Prince Regent",e:100,g:"Historical"},
  {b:"41000106059",s:"honor-bound-his-glorious-return",t:"Honor Bound: His Glorious Return",e:92,g:"Historical"},
  {b:"41000105417",s:"the-time-traveling-special-agent",t:"The Time-Traveling Special Agent",e:82,g:"Historical"},
  {b:"41000105009",s:"his-ascension-from-the-abyss",t:"His Ascension From the Abyss",e:91,g:"Historical"},
  {b:"41000104899",s:"reclaimed-destiny-time-traveling-to-the-throne",t:"Reclaimed Destiny: Time-Traveling to the Throne",e:90,g:"Historical"},
  {b:"41000104288",s:"surviving-the-matriarchal-majesty",t:"Surviving the Matriarchal Majesty",e:85,g:"Historical"},
  {b:"41000104139",s:"the-invincible-time-traveling-prince",t:"The Invincible Time-Traveling Prince",e:91,g:"Historical"},
  {b:"41000103360",s:"the-time-traveling-ruler",t:"The Time-Traveling Ruler",e:101,g:"Historical"},
  {b:"41000100670",s:"let-me-go-my-queen",t:"Let Me Go, My Queen!",e:92,g:"Historical"},
  // Supernatural
  {b:"42000009845",s:"drk",t:"Dr.K",e:52,g:"Supernatural"},
  {b:"42000009619",s:"pregnant-with-my-infertile-alpha-king",t:"Pregnant With My Infertile Alpha King",e:61,g:"Supernatural"},
  {b:"41000120179",s:"am-i-the-villain",t:"Am I the Villain?!",e:45,g:"Supernatural"},
  {b:"41000104482",s:"love-and-sorcery-a-mystical-adventure",t:"Love and Sorcery: A Mystical Adventure",e:78,g:"Supernatural"},
  {b:"41000102761",s:"back-in-time-the-world-bends-to-my-will",t:"Back in Time: The World Bends to My Will",e:89,g:"Supernatural"},
  // Martial Arts
  {b:"42000014100",s:"warning-the-greatest-demon-hunter-is-out",t:"Warning! The Greatest Demon Hunter Is Out!",e:59,g:"Martial Arts"},
  {b:"42000012173",s:"gunverse-rulebreak-protocol",t:"Gunverse: Rulebreak Protocol",e:63,g:"Martial Arts"},
  {b:"42000008766",s:"unit-749s-secret-archive-the-fallen-dragon",t:"Unit 749's Secret Archive: The Fallen Dragon",e:38,g:"Martial Arts"},
  {b:"41000105287",s:"mystic-alliances-conquering-the-underworld",t:"Mystic Alliances: Conquering the Underworld",e:97,g:"Martial Arts"},
  {b:"41000105213",s:"treasure-seeker-the-eyes-that-see-all",t:"Treasure Seeker: The Eyes That See All",e:92,g:"Martial Arts"},
  {b:"41000105137",s:"the-eyes-have-it",t:"The Eyes Have It",e:108,g:"Martial Arts"},
  {b:"41000104293",s:"the-resurrection-code-bringing-my-daughter-back",t:"The Resurrection Code: Bringing My Daughter Back",e:73,g:"Martial Arts"},
  {b:"41000103903",s:"his-eye-of-fortune",t:"His Eye of Fortune",e:104,g:"Martial Arts"},
  {b:"41000103806",s:"rising-with-the-bytes",t:"Rising With the Bytes",e:76,g:"Martial Arts"},
  {b:"41000103455",s:"journey-to-fortune-the-seers-odyssey",t:"Journey to Fortune: The Seer's Odyssey",e:88,g:"Martial Arts"},
  {b:"41000102077",s:"the-girlboss-mysterious-guardian",t:"The Girlboss' Mysterious Guardian",e:93,g:"Martial Arts"},
  {b:"41000100714",s:"profit-prophecy",t:"Profit Prophecy",e:60,g:"Martial Arts"},
  // Mafia
  {b:"42000018512",s:"mafia-single-daddys-stolen-bride",t:"Mafia Single Daddy's Stolen Bride",e:55,g:"Mafia"},
  {b:"42000017817",s:"chained-to-my-ruthless-mafia-dom",t:"Chained to My Ruthless Mafia Dom",e:50,g:"Mafia"},
  {b:"42000016911",s:"billionaires-canvas-cinderella",t:"Billionaire's Canvas Cinderella",e:58,g:"Mafia"},
  {b:"42000016414",s:"mafia-housewife",t:"Mafia Housewife",e:30,g:"Mafia"},
  {b:"42000016626",s:"i-married-a-mafia-king-for-a-lie",t:"I Married a Mafia King for a Lie",e:60,g:"Mafia"},
  {b:"42000015076",s:"mafias-little-grape",t:"Mafia's Little Grape",e:56,g:"Mafia"},
  {b:"42000015328",s:"captive-in-mafia-kings-embrace",t:"Captive In Mafia King's Embrace",e:66,g:"Mafia"},
  {b:"42000016412",s:"mafia-daddys-forbidden-christmas",t:"Mafia Daddy's Forbidden Christmas",e:41,g:"Mafia"},
  {b:"42000015287",s:"my-mafia-boss-boyfriend-dubbed",t:"My Mafia Boss Boyfriend (DUBBED)",e:60,g:"Mafia"},
  {b:"42000014171",s:"dominant-dons-disobedient-girl",t:"Dominant Don's Disobedient Girl",e:56,g:"Mafia"},
  {b:"42000011995",s:"the-christmas-contract-mafias-stand-in-bride",t:"The Christmas Contract: Mafia's Stand-In Bride",e:46,g:"Mafia"},
  {b:"42000012495",s:"never-let-me-go",t:"Never Let Me Go",e:58,g:"Mafia"},
  {b:"42000012496",s:"his-brother-my-lover",t:"His Brother, My Lover!",e:60,g:"Mafia"},
  {b:"42000012540",s:"assassins-apprentice-falling-for-the-target",t:"Assassin's Apprentice Falling for the Target",e:60,g:"Mafia"},
  {b:"42000012552",s:"romance-with-my-vampire-brother",t:"Romance with My Vampire Brother",e:69,g:"Mafia"},
  {b:"42000012558",s:"she-is-my-luna",t:"She is My Luna",e:75,g:"Mafia"},
  {b:"42000011757",s:"7-steamy-days-with-a-gangster",t:"7 Steamy Days with a Gangster",e:60,g:"Mafia"},
  {b:"42000012182",s:"mafia-princess-vows-blood-revenge",t:"Mafia Princess Vows Blood Revenge",e:51,g:"Mafia"},
  {b:"42000011754",s:"irresistible-love-with-my-brother-in-law",t:"Irresistible Love with My Brother in Law",e:52,g:"Mafia"},
  {b:"42000012209",s:"mafia-heiresss-forbidden-obsession",t:"Mafia Heiress's Forbidden Obsession",e:57,g:"Mafia"},
  {b:"42000009611",s:"governor-your-first-lady-is-a-mafia-heiress",t:"Governor, Your First Lady is a Mafia Heiress!",e:60,g:"Mafia"},
  {b:"42000008849",s:"my-mafia-life-from-maid-to-bride",t:"My Mafia Life: From Maid To Bride",e:62,g:"Mafia"},
  {b:"42000008854",s:"double-life-meet-my-mafia-ex-again",t:"Double Life: Meet My Mafia Ex Again",e:93,g:"Mafia"},
  {b:"42000008862",s:"falling-in-love-again-with-my-mafia-husband",t:"Falling in Love Again with My Mafia Husband",e:78,g:"Mafia"},
  {b:"42000008873",s:"the-thief-lover",t:"The Thief Lover",e:75,g:"Mafia"},
  {b:"42000008090",s:"my-cold-hearted-mafia-king",t:"My Cold-Hearted Mafia King",e:55,g:"Mafia"},
  {b:"42000007479",s:"my-mafia-boss-boyfriend",t:"My Mafia Boss Boyfriend",e:60,g:"Mafia"},
  {b:"42000008195",s:"widow-to-queen-the-alphas-resurrection",t:"Widow to Queen: The Alpha's Resurrection",e:56,g:"Mafia"},
  // Destiny
  {b:"42000018330",s:"love-written-across-lifetimes",t:"Love Written Across Lifetimes",e:67,g:"Destiny"},
  {b:"42000012202",s:"love-as-therapy-his-obsession-her-surrender",t:"Love as Therapy: His Obsession, Her Surrender",e:60,g:"Destiny"},
  {b:"41000114167",s:"a-name-they-never-called-with-love",t:"A Name They Never Called with Love",e:51,g:"Destiny"},
  {b:"42000007599",s:"a-fatal-mistake-a-shattered-marriage",t:"A Fatal Mistake, A Shattered Marriage",e:51,g:"Destiny"},
  {b:"42000004532",s:"the-new-rich-family-grudge",t:"The New Rich Family Grudge",e:67,g:"Destiny"},
  {b:"42000004341",s:"love-that-hurts-i-let-go",t:"Love That Hurts, I Let Go",e:70,g:"Destiny"},
  {b:"42000002749",s:"my-crush-thinks-im-a-boy",t:"My Crush Thinks I'm A Boy",e:59,g:"Destiny"},
  {b:"42000000811",s:"your-absence-my-hearts-lesson",t:"Your Absence, My Heart's Lesson",e:69,g:"Destiny"},
  {b:"41000122376",s:"a-thousand-apologies-too-late",t:"A Thousand Apologies, Too Late",e:60,g:"Destiny"},
  {b:"41000121823",s:"to-love-a-mortal-to-defy-forever",t:"To Love a Mortal, To Defy Forever",e:62,g:"Destiny"},
  {b:"41000121745",s:"till-darkness-breathes-you-back",t:"Till Darkness Breathes You Back",e:60,g:"Destiny"},
  {b:"41000121086",s:"the-everlasting-scent-of-us",t:"The Everlasting Scent Of Us",e:50,g:"Destiny"},
  {b:"41000120385",s:"if-time-could-heal-us",t:"If Time Could Heal Us",e:80,g:"Destiny"},
  {b:"41000119916",s:"caught-red-lensed-dangerous-exposure",t:"Caught Red-Lensed: Dangerous Exposure",e:60,g:"Destiny"},
  {b:"41000120135",s:"under-fire-under-your-spell",t:"Under Fire, Under Your Spell",e:71,g:"Destiny"},
  {b:"41000119835",s:"hit-and-run-romance",t:"Hit-and-Run Romance",e:74,g:"Destiny"},
  {b:"41000119260",s:"tuned-to-your-heart",t:"Tuned to Your Heart",e:61,g:"Destiny"},
  {b:"41000119259",s:"i-loved-you-once-but-no-more",t:"I Loved You Once, But No More",e:61,g:"Destiny"},
  {b:"41000118961",s:"she-wore-his-favor-like-a-crown",t:"She Wore His Favor Like a Crown",e:65,g:"Destiny"},
  {b:"41000118715",s:"guilty-without-a-trace",t:"Guilty Without a Trace",e:53,g:"Destiny"},
  // Contract Lover
  {b:"42000017042",s:"falling-for-the-wrong-me",t:"Falling for the Wrong Me",e:56,g:"Contract Lover"},
  {b:"42000017038",s:"fake-it-till-you-date-it",t:"Fake It Till You Date It",e:58,g:"Contract Lover"},
  {b:"42000004388",s:"stop-heartbreak-shes-the-one",t:"Stop Heartbreak: She's the One",e:61,g:"Contract Lover"},
  {b:"42000004622",s:"betrayal-cuts-deep-revenge-hits-hard",t:"Betrayal Cuts Deep, Revenge Hits Hard",e:60,g:"Contract Lover"},
  {b:"42000002889",s:"married-for-money-swayed-by-love",t:"Married for Money, Swayed by Love",e:63,g:"Contract Lover"},
  {b:"42000001050",s:"bridges-to-the-heart",t:"Bridges to the Heart",e:97,g:"Contract Lover"},
  {b:"41000122693",s:"one-night-one-baby-one-forever",t:"One Night, One Baby, One Forever",e:60,g:"Contract Lover"},
  {b:"41000122663",s:"chained-by-affection",t:"Chained by Affection",e:99,g:"Contract Lover"},
  {b:"41000120984",s:"you-are-my-forever-and-always",t:"You Are My Forever and Always",e:78,g:"Contract Lover"},
  {b:"41000119141",s:"kisses-laced-with-lies",t:"Kisses Laced with Lies",e:73,g:"Contract Lover"},
  {b:"41000114890",s:"boxer-boss-cant-get-enough",t:"Boxer Boss Can't Get Enough",e:51,g:"Contract Lover"},
  // Second-chance Love
  {b:"42000017041",s:"the-ceos-maid-turns-out-to-be-the-heiress",t:"The CEO's Maid Turns Out To Be The Heiress",e:55,g:"Second-chance Love"},
  {b:"42000016491",s:"when-the-throne-betrays-its-bladedubbed",t:"When the Throne Betrays Its Blade (DUBBED)",e:72,g:"Second-chance Love"},
  {b:"42000015329",s:"my-master-my-slave",t:"My Master My Slave",e:35,g:"Second-chance Love"},
  {b:"42000014594",s:"too-late-to-love-you",t:"Too Late to Love You",e:53,g:"Second-chance Love"},
  {b:"42000014364",s:"unforgotten-heart",t:"Unforgotten Heart",e:34,g:"Second-chance Love"},
  {b:"42000013013",s:"revenge-of-the-phoenix-heiress",t:"Revenge of the Phoenix Heiress",e:59,g:"Second-chance Love"},
  {b:"42000012972",s:"cause-you-were-never-mine",t:"Cause You Were Never Mine",e:53,g:"Second-chance Love"},
  {b:"42000012339",s:"all-thats-left-of-you-is-historydubbed",t:"All That's Left of You Is History (DUBBED)",e:45,g:"Second-chance Love"},
  {b:"42000012505",s:"fated-for-my-forbidden-guardian",t:"Fated for My Forbidden Guardian",e:64,g:"Second-chance Love"},
  {b:"42000012529",s:"landing-in-love",t:"Landing In Love",e:56,g:"Second-chance Love"},
  {b:"42000012547",s:"tangled-ties-and-tipsy-vows",t:"Tangled Ties and Tipsy Vows",e:69,g:"Second-chance Love"},
  {b:"42000011756",s:"maybe-this-time",t:"Maybe This Time",e:62,g:"Second-chance Love"},
  {b:"42000011766",s:"7-days-to-erase-you-from-my-heart",t:"7 Days to Erase You from My Heart",e:43,g:"Second-chance Love"},
  {b:"42000011762",s:"wildfire-between-us",t:"Wildfire Between Us",e:68,g:"Second-chance Love"},
  {b:"42000011746",s:"falling-for-her-bodyguard",t:"Falling For Her Bodyguard",e:59,g:"Second-chance Love"},
  {b:"42000012537",s:"flashback-fiancée-have-we-met",t:"Flashback Fiancee: Have We Met?",e:79,g:"Second-chance Love"},
  {b:"42000012546",s:"alpha-she-wasnt-the-one",t:"Alpha, She Wasn't the One",e:70,g:"Second-chance Love"},
  {b:"42000011375",s:"ceos-daily-remarriage-plan",t:"CEO's Daily Remarriage Plan",e:60,g:"Second-chance Love"},
  {b:"42000011822",s:"loving-the-disguised-billionaire",t:"Loving the Disguised Billionaire",e:50,g:"Second-chance Love"},
  {b:"42000010114",s:"trapped-as-his-sugar-baby",t:"Trapped as His Sugar Baby",e:68,g:"Second-chance Love"},
  // Betrayal
  {b:"42000017769",s:"rise-as-the-true-heiress",t:"Rise as the True Heiress",e:30,g:"Betrayal"},
  {b:"42000016956",s:"shining-stars-hidden-blades",t:"Shining Stars, Hidden Blades",e:40,g:"Betrayal"},
  {b:"42000016759",s:"blind-eyes-open-heart",t:"Blind Eyes, Open Heart",e:60,g:"Betrayal"},
  {b:"42000016729",s:"i-was-pregnant-while-he-raised-another-family",t:"I Was Pregnant While He Raised Another Family",e:51,g:"Betrayal"},
  {b:"42000015793",s:"please-seduce-my-husband",t:"Please Seduce My Husband",e:53,g:"Betrayal"},
  {b:"42000014573",s:"when-vows-break-true-love-begins",t:"When Vows Break, True Love Begins",e:61,g:"Betrayal"},
  {b:"42000014661",s:"love-you-more-than-myself",t:"Love You More than Myself",e:27,g:"Betrayal"},
  {b:"42000014592",s:"blood-doesnt-make-you-family",t:"Blood Doesn't Make You Family",e:52,g:"Betrayal"},
  {b:"42000014642",s:"the-pregnant-top-heiress-tolerates-no-cheaters",t:"The Pregnant Top Heiress Tolerates No Cheaters",e:53,g:"Betrayal"},
  {b:"41000120912",s:"the-new-city-wives",t:"The New City Wives",e:50,g:"Betrayal"},
  {b:"42000011988",s:"raised-by-the-thief-who-stole-my-life",t:"Raised by The Thief Who Stole My Life",e:43,g:"Betrayal"},
  {b:"42000011990",s:"divorced-at-giving-birth-day",t:"Divorced At Giving Birth Day",e:50,g:"Betrayal"},
  {b:"42000013018",s:"the-vows-we-never-made-",t:"The Vows We Never Made",e:52,g:"Betrayal"},
  {b:"42000012881",s:"loving-you-costs-my-life",t:"Loving You Costs My Life",e:25,g:"Betrayal"},
  {b:"42000012492",s:"the-missing-heiress-spoiled-by-three-billionaire-brothers",t:"The Missing Heiress Spoiled by Three Billionaire Brothers",e:54,g:"Betrayal"},
  {b:"42000011981",s:"out-of-prison-out-of-blood-ties",t:"Out of Prison, Out of Blood Ties",e:43,g:"Betrayal"},
  {b:"42000012489",s:"seven-day-revenge",t:"Seven Day Revenge",e:27,g:"Betrayal"},
  {b:"42000012503",s:"another-kind-of-exchange-wife",t:"Another Kind of Exchange Wife",e:45,g:"Betrayal"},
  {b:"42000002317",s:"i-wish-hed-been-struck",t:"I Wish He'd Been Struck",e:51,g:"Betrayal"},
  {b:"42000011507",s:"enough-no-more-mrsnice-wife",t:"Enough! No More Mrs.Nice Wife",e:62,g:"Betrayal"},
  // Counterattack (20)
  {b:"42000018761",s:"dragon-ascendant-heaven-shall-tremble",t:"Dragon Ascendant: Heaven Shall Tremble",e:44,g:"Counterattack"},
  {b:"42000018808",s:"whats-mine-is-not-yours-to-take",t:"What's Mine Is Not Yours to Take",e:63,g:"Counterattack"},
  {b:"42000018746",s:"reborn-coroner-i-quit",t:"Reborn Coroner: I Quit",e:61,g:"Counterattack"},
  {b:"42000018461",s:"she-was-no-disaster-but-their-greatest-blessing",t:"She Was No Disaster, But Their Greatest Blessing",e:77,g:"Counterattack"},
  {b:"42000017927",s:"venomous-witch-doctor-saving-lives-crushing-foes",t:"Venomous Witch Doctor: Saving Lives, Crushing Foes",e:50,g:"Counterattack"},
  {b:"42000018638",s:"forsake-the-guardian-welcome-your-doom",t:"Forsake the Guardian, Welcome Your Doom",e:60,g:"Counterattack"},
  {b:"42000018608",s:"withered-wings-of-yesterday",t:"Withered Wings of Yesterday",e:50,g:"Counterattack"},
  {b:"42000018164",s:"listening-to-my-baby-expose-their-sins",t:"Listening to My Baby Expose Their Sins",e:67,g:"Counterattack"},
  {b:"42000018230",s:"a-love-worth-waiting-for",t:"A Love Worth Waiting For",e:43,g:"Counterattack"},
  {b:"42000017040",s:"ignited-by-my-besties-son",t:"Ignited By My Bestie's Son",e:53,g:"Counterattack"},
  {b:"42000018516",s:"the-icy-ceo-heard-my-filthy-thoughts-and-hired-me-on-the-spot",t:"The Icy CEO Heard My Filthy Thoughts",e:50,g:"Counterattack"},
  {b:"42000017877",s:"the-hidden-supreme-rise-of-the-godslayer",t:"The Hidden Supreme: Rise of the Godslayer",e:80,g:"Counterattack"},
  {b:"42000018344",s:"her-game-was-his-heartdubbed",t:"Her Game Was His Heart (DUBBED)",e:60,g:"Counterattack"},
  {b:"42000017033",s:"the-hot-vet-next-door-is-my-husband",t:"The Hot Vet Next Door is My Husband",e:58,g:"Counterattack"},
  {b:"42000018292",s:"just-a-security-guard-yet-he-won-their-hearts",t:"Just a Security Guard, Yet He Won Their Hearts",e:75,g:"Counterattack"},
  {b:"42000017878",s:"the-blindfold-you-called-love",t:"The Blindfold You Called Love",e:35,g:"Counterattack"},
  {b:"42000018255",s:"my-husbands-secret-went-viral",t:"My Husband's Secret Went Viral",e:82,g:"Counterattack"},
  {b:"42000018249",s:"queen-of-speed-racing-to-glory",t:"Queen of Speed: Racing to Glory",e:53,g:"Counterattack"},
  {b:"42000018134",s:"summoning-the-divine-breaking-the-heavens",t:"Summoning the Divine, Breaking the Heavens",e:67,g:"Counterattack"},
  {b:"42000018059",s:"the-villainess-everyone-chose-to-love",t:"The Villainess Everyone Chose to Love",e:74,g:"Counterattack"},
  // Secret Identity (20)
  {b:"42000012387",s:"old-soldiers-never-die",t:"Old Soldiers Never Die",e:53,g:"Secret Identity"},
  {b:"42000011523",s:"falling-for-the-janitor-everyone-looked-down-ondubbed",t:"Falling for the Janitor Everyone Looked Down On (DUBBED)",e:56,g:"Secret Identity"},
  {b:"42000009539",s:"return-of-the-gold-king",t:"Return Of The Gold King",e:53,g:"Secret Identity"},
  {b:"42000009099",s:"being-fired-now-im-out-of-their-league",t:"Being Fired? Now I'm Out of Their League!",e:59,g:"Secret Identity"},
  {b:"42000007830",s:"house-husband-he-is-supreme-ghost-lord",t:"House Husband? He is Supreme Ghost Lord!",e:59,g:"Secret Identity"},
  {b:"42000006665",s:"house-husband-supreme",t:"House Husband Supreme",e:57,g:"Secret Identity"},
  {b:"42000005751",s:"i-left-my-cheating-ex-and-became-a-billionaire",t:"I Left My Cheating Ex and Became a Billionaire",e:60,g:"Secret Identity"},
  {b:"42000005817",s:"the-missing-kitchen-king",t:"The Missing Kitchen King",e:65,g:"Secret Identity"},
  {b:"42000004357",s:"watch-out-i-call-the-final-shots",t:"Watch Out! I Call the Final Shots",e:63,g:"Secret Identity"},
  {b:"42000003794",s:"falling-for-the-janitor-everyone-looked-down-on",t:"Falling for the Janitor Everyone Looked Down On",e:56,g:"Secret Identity"},
  {b:"42000000577",s:"the-lost-heir-a-christmas-reckoning",t:"The Lost Heir: A Christmas Reckoning",e:52,g:"Secret Identity"},
  {b:"41000120351",s:"bossmoveshewhoturnstides",t:"Boss Moves: He Who Turns Tides",e:83,g:"Secret Identity"},
  {b:"41000119300",s:"tripped-into-time-forged-a-legend",t:"Tripped Into Time, Forged a Legend",e:105,g:"Secret Identity"},
  {b:"41000119249",s:"he-who-fell-for-me",t:"He Who Fell for Me",e:67,g:"Secret Identity"},
  {b:"41000119204",s:"three-inches-from-judgment",t:"Three Inches from Judgment",e:60,g:"Secret Identity"},
  {b:"41000117191",s:"faded-threads",t:"Faded Threads",e:60,g:"Secret Identity"},
  {b:"41000116657",s:"the-outcast-makes-a-comeback",t:"The Outcast Makes a Comeback",e:74,g:"Secret Identity"},
  {b:"41000102001",s:"from-anonymity-to-stardom",t:"From Anonymity to Stardom",e:101,g:"Secret Identity"},
  // Love Triangle (20)
  {b:"42000017043",s:"making-of-an-heiress",t:"Making of An Heiress",e:67,g:"Love Triangle"},
  {b:"42000016909",s:"my-substitute-ceo",t:"My Substitute CEO",e:63,g:"Love Triangle"},
  {b:"42000015947",s:"the-rejected-ex-mate-secret-identity",t:"The Rejected Ex-mate Secret Identity",e:45,g:"Love Triangle"},
  {b:"42000014591",s:"bumpkin-virgin-and-her-billionaire-stepbrother",t:"Bumpkin Virgin and Her Billionaire Stepbrother",e:59,g:"Love Triangle"},
  {b:"42000014431",s:"my-miscarriage-his-flirt-with-mistress",t:"My Miscarriage, His Flirt with Mistress",e:50,g:"Love Triangle"},
  {b:"42000012442",s:"my-son-wanted-a-new-mom-i-quit",t:"My Son Wanted a New Mom, I Quit",e:51,g:"Love Triangle"},
  {b:"42000011755",s:"golden-feather-temptation-game",t:"Golden Feather: Temptation Game",e:52,g:"Love Triangle"},
  {b:"42000012172",s:"trapped-by-my-four-exes",t:"Trapped by My Four Exes",e:60,g:"Love Triangle"},
  {b:"42000011797",s:"love-love-change",t:"Love Love Change",e:50,g:"Love Triangle"},
  {b:"42000012113",s:"torn-between-my-stepbrothers",t:"Torn Between My Stepbrothers",e:71,g:"Love Triangle"},
  {b:"42000002314",s:"here-comes-mr-trouble",t:"Here Comes Mr. Trouble",e:50,g:"Love Triangle"},
  {b:"42000009489",s:"sex-education-by-my-best-friend",t:"Sex Education By My Best Friend",e:58,g:"Love Triangle"},
  {b:"42000010009",s:"love-desire-or-just-a-game",t:"Love, Desire, or Just a Game",e:61,g:"Love Triangle"},
  {b:"42000009616",s:"taming-mr-champion",t:"Taming Mr. Champion",e:60,g:"Love Triangle"},
  {b:"42000009240",s:"ceo-daddy-please-dont-catch-me",t:"CEO Daddy, Please Don't Catch Me!",e:53,g:"Love Triangle"},
  {b:"42000008773",s:"her-forbidden-lovers",t:"Her Forbidden Lovers",e:57,g:"Love Triangle"},
  {b:"42000009584",s:"love-reset-game",t:"Love Reset Game",e:51,g:"Love Triangle"},
  {b:"42000007205",s:"the-one-that-got-away",t:"The One That Got Away",e:63,g:"Love Triangle"},
  // Forbidden Love (20)
  {b:"42000017046",s:"my-stepdaughters-idol-is-my-junior-boyfriend",t:"My Stepdaughter's Idol is My Junior Boyfriend",e:58,g:"Forbidden Love"},
  {b:"42000016624",s:"my-dirty-secret-with-the-wrong-stepbrother",t:"My Dirty Secret With The Wrong Stepbrother",e:78,g:"Forbidden Love"},
  {b:"42000015527",s:"submitting-to-my-besties-dad",t:"Submitting to My Bestie's Dad",e:60,g:"Forbidden Love"},
  {b:"42000014005",s:"bucked-by-my-fathers-cowboy",t:"Bucked by My Father's Cowboy",e:51,g:"Forbidden Love"},
  {b:"42000011983",s:"secret-affair-with-my-husbands-boss",t:"Secret Affair With My Husband's Boss",e:43,g:"Forbidden Love"},
  {b:"42000011658",s:"revenge-after-centuries",t:"Revenge After Centuries",e:44,g:"Forbidden Love"},
  {b:"42000008795",s:"one-night-stand-with-my-husbands-brother",t:"One Night Stand with My Husband's Brother",e:79,g:"Forbidden Love"},
  {b:"42000008847",s:"fake-bonds-true-love",t:"Fake Bonds, True Love",e:76,g:"Forbidden Love"},
  {b:"42000008475",s:"love-at-the-end-of-his-lie",t:"Love at the End of His Lie",e:57,g:"Forbidden Love"},
  {b:"42000008330",s:"dont-let-your-son-fall-hon",t:"Don't Let Your Son Fall, Hon",e:50,g:"Forbidden Love"},
  {b:"42000006143",s:"the-whole-family-dotes-on-her",t:"The Whole Family Dotes on Her",e:62,g:"Forbidden Love"},
  {b:"42000005935",s:"daddy-save-me",t:"Daddy, Save Me",e:40,g:"Forbidden Love"},
  {b:"42000005962",s:"dont-be-jealousyour-grace-",t:"Don't Be Jealous, Your Grace!",e:60,g:"Forbidden Love"},
  {b:"42000005967",s:"fly-me-away-my-captain-husband",t:"Fly Me Away My Captain Husband",e:57,g:"Forbidden Love"},
  {b:"42000005968",s:"forbidden-love-is-in-the-air",t:"Forbidden Love Is in the Air",e:62,g:"Forbidden Love"},
  {b:"42000005934",s:"cuffed-to-my-silver-fox-captain",t:"Cuffed to My Silver Fox Captain",e:52,g:"Forbidden Love"},
  {b:"42000004534",s:"generals-lustful-confession",t:"General's Lustful Confession",e:53,g:"Forbidden Love"},
  {b:"42000004540",s:"boss-behind-the-scenes-is-my-husband",t:"Boss Behind the Scenes Is My Husband",e:67,g:"Forbidden Love"},
  {b:"42000003747",s:"the-thorn-in-his-rose",t:"The Thorn in His Rose",e:48,g:"Forbidden Love"},
  {b:"41000122662",s:"the-hidden-half-of-love",t:"The Hidden Half of Love",e:73,g:"Forbidden Love"},
  // Sweet Love (20)
  {b:"42000018469",s:"contract-lover",t:"Contract Lover",e:60,g:"Sweet Love"},
  {b:"42000016699",s:"as-you-like-it",t:"As You Like It",e:60,g:"Sweet Love"},
  {b:"42000015421",s:"delivered-by-destiny-dubbed",t:"Delivered by Destiny (DUBBED)",e:66,g:"Sweet Love"},
  {b:"41000104123",s:"second-chance-in-serendipity",t:"Second Chance in Serendipity",e:73,g:"Sweet Love"},
  {b:"42000011997",s:"love-through-all-seasons",t:"Love Through All Seasons",e:58,g:"Sweet Love"},
  {b:"42000011899",s:"acting-for-real-he-fell-first",t:"Acting for Real: He Fell First",e:60,g:"Sweet Love"},
  {b:"42000013140",s:"move-to-countryside-marry-a-billionaire",t:"Move to Countryside, Marry a Billionaire",e:59,g:"Sweet Love"},
  {b:"42000012237",s:"the-ceos-secret-loverdubbed",t:"The CEO's Secret Lover (DUBBED)",e:60,g:"Sweet Love"},
  {b:"42000011408",s:"delivered-by-destiny",t:"Delivered by Destiny",e:66,g:"Sweet Love"},
  {b:"42000012239",s:"brothers-rival-my-secret-loverdubbed",t:"Brother's Rival, My Secret Lover (DUBBED)",e:50,g:"Sweet Love"},
  {b:"42000011264",s:"after-prison-falling-for-the-billionaire-single-dad",t:"After Prison, Falling for the Billionaire Single Dad",e:54,g:"Sweet Love"},
  {b:"42000011369",s:"twin-matchmakers-billionaire-dads-love-quest",t:"Twin Matchmakers: Billionaire Dad's Love Quest",e:63,g:"Sweet Love"},
  {b:"42000011265",s:"escape-with-bosss-baby",t:"Escape with Boss's Baby",e:48,g:"Sweet Love"},
  {b:"42000010896",s:"keeping-his-baby-and-his-heart",t:"Keeping His Baby and His Heart",e:51,g:"Sweet Love"},
  {b:"42000009585",s:"billionheirs-obsession",t:"BillionHeir's Obsession",e:58,g:"Sweet Love"},
  {b:"42000009221",s:"brothers-rival-my-secret-lover-",t:"Brother's Rival, My Secret Lover",e:50,g:"Sweet Love"},
  {b:"42000009004",s:"the-ceos-secret-lover",t:"The CEO's Secret Lover",e:60,g:"Sweet Love"},
  // Marriage Before Love (20)
  {b:"42000014354",s:"the-amazing-mr-and-mrs-bennett",t:"The Amazing Mr. and Mrs. Bennett",e:35,g:"Marriage Before Love"},
  {b:"42000011904",s:"pregnant-by-my-professor-chased-by-his-son",t:"Pregnant by My Professor, Chased by His Son",e:49,g:"Marriage Before Love"},
  {b:"42000011759",s:"married-a-gardener-got-a-prince",t:"Married a Gardener, Got a Prince",e:58,g:"Marriage Before Love"},
  {b:"42000011758",s:"the-double-life-of-mr-president",t:"The Double Life of Mr President",e:45,g:"Marriage Before Love"},
  {b:"42000011378",s:"pick-up-a-billionare-husband",t:"Pick up A Billionaire Husband",e:60,g:"Marriage Before Love"},
  {b:"42000010438",s:"30-days-to-be-the-mafia-kings-bride",t:"30 Days to be the Mafia King's Bride",e:52,g:"Marriage Before Love"},
  {b:"42000008868",s:"say-my-name",t:"Say My Name",e:52,g:"Marriage Before Love"},
  {b:"42000008886",s:"bought-with-gold-bound-by-love",t:"Bought with Gold, Bound by Love",e:20,g:"Marriage Before Love"},
  {b:"42000008493",s:"one-night-with-the-virgin-ceo",t:"One Night With the Virgin CEO",e:71,g:"Marriage Before Love"},
  {b:"42000008845",s:"the-mafia-king-kept-me-in-the-dark",t:"The Mafia King Kept Me in the Dark",e:61,g:"Marriage Before Love"},
  {b:"42000008075",s:"but-daddy-i-love-him",t:"But Daddy I Love Him",e:60,g:"Marriage Before Love"},
  {b:"42000008205",s:"memory-reset-mr-restraint-begged-for-love",t:"Memory Reset: Mr. Restraint Begged for Love",e:59,g:"Marriage Before Love"},
  {b:"42000008247",s:"marrying-my-exs-boss",t:"Marrying My Ex's Boss",e:67,g:"Marriage Before Love"},
  {b:"42000008216",s:"hit-the-jackpot-my-broke-chef-husband-is-a-billionaire",t:"Hit the Jackpot! My Broke Chef Husband Is a Billionaire?!",e:69,g:"Marriage Before Love"},
  {b:"42000007395",s:"the-stolen-first-husband",t:"The Stolen First Husband",e:65,g:"Marriage Before Love"},
  {b:"42000006848",s:"oh-no-my-husband-is-my-boss",t:"Oh No! My Husband Is My Boss!",e:71,g:"Marriage Before Love"},
  {b:"42000006283",s:"love-after-losing-it-all",t:"Love After Losing It All",e:51,g:"Marriage Before Love"},
  // Concealed Identity (20)
  {b:"42000018104",s:"my-cheating-hubbys-final-voyage",t:"My Cheating Hubby's Final Voyage",e:50,g:"Concealed Identity"},
  {b:"42000017503",s:"he-gave-my-seat-away-so-my-father-took-his-empire",t:"He Gave My Seat Away, So My Father Took His Empire",e:50,g:"Concealed Identity"},
  {b:"42000016910",s:"heartbeat-alert",t:"Heartbeat Alert",e:67,g:"Concealed Identity"},
  {b:"42000016907",s:"the-secret-heiress-and-her-two-faced-lover",t:"The Secret Heiress and her Two-Faced Lover",e:51,g:"Concealed Identity"},
  {b:"42000014464",s:"where-were-you-when-i-fell",t:"Where Were You When I Fell",e:57,g:"Concealed Identity"},
  {b:"42000014569",s:"the-fake-debutante-and-the-true-billionaire",t:"The Fake Debutante and the True Billionaire",e:54,g:"Concealed Identity"},
  {b:"42000011986",s:"the-last-christmas-for-daddy-to-love-me",t:"The Last Christmas For Daddy To Love Me",e:33,g:"Concealed Identity"},
  {b:"42000011914",s:"step-aside-im-the-a-heiress",t:"Step Aside, I'm the A+ Heiress",e:61,g:"Concealed Identity"},
  {b:"42000012382",s:"the-lost-heiress",t:"The Lost Heiress",e:34,g:"Concealed Identity"},
  {b:"42000012565",s:"two-faced-mistress-seduction--schemes",t:"Two-Faced Mistress Seduction & Schemes",e:71,g:"Concealed Identity"},
  {b:"42000011996",s:"merry-prince-mas",t:"Merry Prince-Mas!",e:52,g:"Concealed Identity"},
  {b:"42000010635",s:"shade-escape",t:"Shade Escape",e:20,g:"Concealed Identity"},
  {b:"42000010550",s:"till-greed-do-us-part",t:"Till Greed Do Us Part",e:31,g:"Concealed Identity"},
  {b:"42000011371",s:"the-secretary-who-obsessed-the-ceo",t:"The Secretary Who Obsessed the CEO",e:70,g:"Concealed Identity"},
  {b:"42000010673",s:"between-lies-and-love",t:"Between Lies and Love",e:52,g:"Concealed Identity"},
  {b:"42000010322",s:"the-phantom-of-iris",t:"The Phantom of IRIS",e:35,g:"Concealed Identity"},
  {b:"42000010641",s:"fated-to-my-ruthless-alpha",t:"Fated to My Ruthless Alpha",e:60,g:"Concealed Identity"},
  {b:"42000010115",s:"in-sisters-name-time-for-payback",t:"In Sister's Name: Time for Payback",e:65,g:"Concealed Identity"},
  {b:"42000009743",s:"your-ladyships-escorting-ceo",t:"Your Ladyship's Escorting CEO",e:70,g:"Concealed Identity"},
  {b:"42000009374",s:"oops-the-ceos-birthday-is-ruined",t:"Oops! The CEO's Birthday is Ruined",e:51,g:"Concealed Identity"},
  // Family (extra)
  {b:"42000010899",s:"love-the-way-you-lie",t:"Love The Way You Lie",e:59,g:"Family"},
  {b:"42000010959",s:"a-buried-secret-a-broken-reunion",t:"A Buried Secret, A Broken Reunion",e:78,g:"Family"},
  {b:"42000009640",s:"the-world-calls-me-evil-my-family-calls-me-precious",t:"The World Calls Me Evil, My Family Calls Me Precious",e:60,g:"Family"},
  {b:"42000009063",s:"i-was-your-mother-once",t:"I Was Your Mother Once",e:51,g:"Family"},
  {b:"42000009023",s:"a-heart-so-small-a-love-so-big",t:"A Heart So Small, A Love So Big",e:70,g:"Family"},
  {b:"42000007100",s:"alpha-of-shadows-the-queen-returns",t:"Alpha of Shadows: The Queen Returns",e:54,g:"Family"},
  {b:"42000008218",s:"breaking-chains-for-a-new-life",t:"Breaking Chains for a New Life",e:57,g:"Family"},
  {b:"42000008174",s:"my-husband-is-an-american-hero",t:"My Husband Is An American Hero",e:55,g:"Family"},
  {b:"42000007334",s:"silly-daddy-when-are-you-gonna-find-mommy",t:"Silly Daddy, When Are You Gonna Find Mommy",e:50,g:"Family"},
  {b:"42000006955",s:"come-back-home-my-son",t:"Come Back Home, My Son",e:53,g:"Family"},
  // CEO (extra)
  {b:"42000013145",s:"one-night-with-the-virgin-ceo-dubbed",t:"One Night With the Virgin CEO (DUBBED)",e:71,g:"CEO"},
  {b:"42000012902",s:"ex-convict-cleaner-and-the-billionaire-single-dad",t:"Ex-Convict Cleaner and the Billionaire Single Dad",e:54,g:"CEO"},
  {b:"42000012493",s:"love-me-again-my-hidden-lover",t:"Love Me Again, My Hidden Lover",e:62,g:"CEO"},
  {b:"42000012502",s:"help-save-this-baby-the-insurance-ceo-is-trying-to-kill",t:"Help! Save This Baby the Insurance CEO Is Trying to Kill!",e:50,g:"CEO"},
  {b:"42000012491",s:"from-bump-to-spark",t:"From Bump to Spark",e:59,g:"CEO"},
  {b:"42000011751",s:"artificial-love",t:"Artificial Love",e:61,g:"CEO"},
  {b:"42000011747",s:"pregnant-by-the-luxury-empire-heir",t:"Pregnant By The Luxury Empire Heir",e:47,g:"CEO"},
];

function genId(n){return n.toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")}
function rViews(){return Math.floor(Math.random()*80000000)+500000}
function rRating(){return(Math.random()*2.5+7.0).toFixed(1)}
function coverUrl(id){return id.startsWith("41")?`https://thwztchapter.dramaboxdb.com/data/cppartner/4x1/41x0/410x0/${id}/${id}.jpg`:`https://thwztchapter.dramaboxdb.com/data/cppartner/4x2/42x0/420x0/${id}/${id}.jpg`}

async function uploadImg(url){
  try{
    const r=await fetch(url+"@w=480&h=720",{headers:{"User-Agent":"Mozilla/5.0"}});
    if(!r.ok)return null;
    const buf=Buffer.from(await r.arrayBuffer());
    const form=new FormData();form.append("image",buf.toString("base64"));
    const u=await fetch("https://api.imageban.ru/v1",{method:"POST",headers:{Authorization:`Bearer ${IMAGEBAN_KEY}`},body:form});
    const d=await u.json();
    return d.success&&d.data?.link?d.data.link:null;
  }catch{return null}
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function main(){
  console.log("=== Genre Fill Seeder ===\n");
  const map=new Map();
  for(const d of ALL){
    const id=String(d.b);
    if(map.has(id)){map.get(id).genres.push(d.g)}
    else map.set(id,{bookId:id,slug:d.s,title:d.t,episodes:d.e,genres:[d.g]});
  }
  console.log(`Unique dramas to process: ${map.size}`);

  const conn=await mysql.createConnection(DB);
  const [ex]=await conn.execute("SELECT drama_id FROM dramas");
  const exIds=new Set(ex.map(d=>d.drama_id));
  const [exG]=await conn.execute("SELECT id,slug,name FROM genres");
  const gMap=new Map();exG.forEach(g=>{gMap.set(g.slug,g.id);gMap.set(g.name.toLowerCase(),g.id)});

  async function ensureG(name){
    const slug=name.toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-");
    let id=gMap.get(slug)||gMap.get(name.toLowerCase());
    if(!id){const[r]=await conn.execute("INSERT INTO genres (name,slug) VALUES (?,?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",[name,slug]);id=r.insertId;gMap.set(slug,id);gMap.set(name.toLowerCase(),id);console.log(`  New genre: ${name}`)}
    return id;
  }

  let ins=0,skip=0,fail=0;
  const entries=Array.from(map.values());
  for(let i=0;i<entries.length;i++){
    const d=entries[i];const did=genId(d.title);
    if(exIds.has(did)){
      // Still link genres for existing dramas
      const [rows]=await conn.execute("SELECT sno FROM dramas WHERE drama_id=?",[did]);
      if(rows.length>0){
        for(const gn of d.genres){
          const gid=await ensureG(gn);
          await conn.execute("INSERT IGNORE INTO drama_genres (drama_sno,genre_id) VALUES (?,?)",[rows[0].sno,gid]);
        }
      }
      skip++;continue;
    }
    process.stdout.write(`[${i+1}/${entries.length}] ${d.title.substring(0,45)}...`);
    try{
      await sleep(800);
      const img=await uploadImg(coverUrl(d.bookId));
      const src=`https://www.dramaboxdb.com/movie/${d.bookId}/${d.slug}`;
      const poster=img||coverUrl(d.bookId)+"@w=480&h=720";
      const[ir]=await conn.execute(
        `INSERT INTO dramas (drama_id,name,original_name,type,origin,language,rating,episode_count,small_poster,large_poster,collection_source,all_time_watch_count) VALUES (?,?,?,'short_drama','chinese','subbed',?,?,?,?,?,?)`,
        [did,d.title,d.title,rRating(),d.episodes,poster,poster,src,rViews()]
      );
      const sno=ir.insertId;
      for(const gn of d.genres){const gid=await ensureG(gn);await conn.execute("INSERT IGNORE INTO drama_genres (drama_sno,genre_id) VALUES (?,?)",[sno,gid])}
      exIds.add(did);ins++;
      console.log(` OK`);
    }catch(e){console.log(` FAIL: ${e.message}`);fail++}
  }

  console.log(`\n=== DONE === Inserted: ${ins}, Skipped: ${skip}, Failed: ${fail}`);
  const[gs]=await conn.execute("SELECT g.name,COUNT(dg.drama_sno) as c FROM genres g LEFT JOIN drama_genres dg ON g.id=dg.genre_id GROUP BY g.id ORDER BY c DESC");
  console.log("\nGenre distribution:");gs.forEach(g=>console.log(`  ${g.name}: ${g.c}`));
  const[tc]=await conn.execute("SELECT COUNT(*) as c FROM dramas");
  console.log(`\nTotal dramas: ${tc[0].c}`);
  await conn.end();
}
main().catch(e=>{console.error(e);process.exit(1)});
