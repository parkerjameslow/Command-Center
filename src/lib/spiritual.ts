import type { AppData } from "./store";

export interface SpiritualTheme {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  bible: { reference: string; text: string; url: string };
  bom: { reference: string; text: string; url: string };
  talk: { title: string; speaker: string; year: string; url: string };
}

// Scripture URLs on churchofjesuschrist.org
const bibleUrl = (slug: string, id: string) => `https://www.churchofjesuschrist.org/study/scriptures/ot-nt/${slug}?id=${id}&lang=eng#${id}`;
const bomUrl = (slug: string, id: string) => `https://www.churchofjesuschrist.org/study/scriptures/bofm/${slug}?id=${id}&lang=eng#${id}`;

export const THEMES: SpiritualTheme[] = [
  {
    id: "faith-in-christ",
    title: "Faith in Christ",
    summary: "Trust Him even when you can't see the whole path.",
    tags: ["faith", "uncertainty", "trust", "christ"],
    bible: {
      reference: "Hebrews 11:1",
      text: "Now faith is the substance of things hoped for, the evidence of things not seen.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/heb/11?lang=eng",
    },
    bom: {
      reference: "Alma 32:21",
      text: "And now as I said concerning faith—faith is not to have a perfect knowledge of things; therefore if ye have faith ye hope for things which are not seen, which are true.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/32?lang=eng",
    },
    talk: {
      title: "Faith Is Not by Chance, but by Choice",
      speaker: "Neil L. Andersen",
      year: "October 2015",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2015/10/faith-is-not-by-chance-but-by-choice?lang=eng",
    },
  },
  {
    id: "gratitude",
    title: "Gratitude",
    summary: "Thankfulness in every circumstance — not just the good.",
    tags: ["gratitude", "thanksgiving", "joy", "contentment"],
    bible: {
      reference: "1 Thessalonians 5:18",
      text: "In every thing give thanks: for this is the will of God in Christ Jesus concerning you.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/1-thes/5?lang=eng",
    },
    bom: {
      reference: "Alma 34:38",
      text: "That ye live in thanksgiving daily, for the many mercies and blessings which he doth bestow upon you.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/34?lang=eng",
    },
    talk: {
      title: "Grateful in Any Circumstances",
      speaker: "Dieter F. Uchtdorf",
      year: "April 2014",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2014/04/grateful-in-any-circumstances?lang=eng",
    },
  },
  {
    id: "service",
    title: "Service",
    summary: "Love in action — how we show Christ we follow Him.",
    tags: ["service", "helping", "others", "work"],
    bible: {
      reference: "Matthew 25:40",
      text: "Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/matt/25?lang=eng",
    },
    bom: {
      reference: "Mosiah 2:17",
      text: "When ye are in the service of your fellow beings ye are only in the service of your God.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/mosiah/2?lang=eng",
    },
    talk: {
      title: "Waiting on the Road to Damascus",
      speaker: "Dieter F. Uchtdorf",
      year: "April 2011",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2011/04/waiting-on-the-road-to-damascus?lang=eng",
    },
  },
  {
    id: "family",
    title: "Family",
    summary: "The most important work you'll ever do is within the walls of your own home.",
    tags: ["family", "home", "parenting", "marriage"],
    bible: {
      reference: "Joshua 24:15",
      text: "As for me and my house, we will serve the Lord.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/ot/josh/24?lang=eng",
    },
    bom: {
      reference: "Mosiah 4:15",
      text: "But ye will teach them to walk in the ways of truth and soberness; ye will teach them to love one another, and to serve one another.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/mosiah/4?lang=eng",
    },
    talk: {
      title: "Because of Your Faith",
      speaker: "Henry B. Eyring",
      year: "October 2010",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2010/10/because-of-your-faith?lang=eng",
    },
  },
  {
    id: "fatherhood",
    title: "Fatherhood",
    summary: "Raise them in the nurture and admonition of the Lord.",
    tags: ["fatherhood", "children", "kids", "family", "priesthood"],
    bible: {
      reference: "Ephesians 6:4",
      text: "And, ye fathers, provoke not your children to wrath: but bring them up in the nurture and admonition of the Lord.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/eph/6?lang=eng",
    },
    bom: {
      reference: "3 Nephi 18:21",
      text: "Pray in your families unto the Father, always in my name, that your wives and your children may be blessed.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/3-ne/18?lang=eng",
    },
    talk: {
      title: "Fathers and Sons: A Remarkable Relationship",
      speaker: "M. Russell Ballard",
      year: "October 2009",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2009/10/fathers-and-sons-a-remarkable-relationship?lang=eng",
    },
  },
  {
    id: "marriage",
    title: "Marriage",
    summary: "Love her as Christ loved the church.",
    tags: ["marriage", "wife", "love", "family"],
    bible: {
      reference: "Ephesians 5:25",
      text: "Husbands, love your wives, even as Christ also loved the church, and gave himself for it.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/eph/5?lang=eng",
    },
    bom: {
      reference: "Jacob 2:35",
      text: "Ye have broken the hearts of your tender wives, and lost the confidence of your children, because of your bad examples before them.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/jacob/2?lang=eng",
    },
    talk: {
      title: "Celestial Marriage",
      speaker: "Russell M. Nelson",
      year: "October 2008",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2008/10/celestial-marriage?lang=eng",
    },
  },
  {
    id: "charity",
    title: "Charity",
    summary: "The pure love of Christ — bear one another's burdens.",
    tags: ["charity", "love", "kindness", "connection"],
    bible: {
      reference: "1 Corinthians 13:4-5",
      text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up, doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/1-cor/13?lang=eng",
    },
    bom: {
      reference: "Moroni 7:47",
      text: "But charity is the pure love of Christ, and it endureth forever; and whoso is found possessed of it at the last day, it shall be well with him.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/moro/7?lang=eng",
    },
    talk: {
      title: "Lift Where You Stand",
      speaker: "Dieter F. Uchtdorf",
      year: "October 2008",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2008/10/lift-where-you-stand?lang=eng",
    },
  },
  {
    id: "hope",
    title: "Hope",
    summary: "A better world — anchored in Christ.",
    tags: ["hope", "sadness", "discouragement", "comfort", "low-mood"],
    bible: {
      reference: "Romans 15:13",
      text: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/rom/15?lang=eng",
    },
    bom: {
      reference: "Ether 12:4",
      text: "Wherefore, whoso believeth in God might with surety hope for a better world, yea, even a place at the right hand of God.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/ether/12?lang=eng",
    },
    talk: {
      title: "The Infinite Power of Hope",
      speaker: "Dieter F. Uchtdorf",
      year: "October 2008",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2008/10/the-infinite-power-of-hope?lang=eng",
    },
  },
  {
    id: "peace",
    title: "Peace",
    summary: "His peace, not as the world giveth.",
    tags: ["peace", "anxiety", "worry", "stress", "rest"],
    bible: {
      reference: "John 14:27",
      text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/john/14?lang=eng",
    },
    bom: {
      reference: "Mosiah 4:3",
      text: "And they were filled with joy, having received a remission of their sins, and having peace of conscience.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/mosiah/4?lang=eng",
    },
    talk: {
      title: "Peace of Conscience and Peace of Mind",
      speaker: "Richard G. Scott",
      year: "October 2004",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2004/10/peace-of-conscience-and-peace-of-mind?lang=eng",
    },
  },
  {
    id: "repentance",
    title: "Repentance",
    summary: "Not a punishment — a gift. Change, clean, come back.",
    tags: ["repentance", "mistakes", "sin", "change"],
    bible: {
      reference: "Acts 3:19",
      text: "Repent ye therefore, and be converted, that your sins may be blotted out, when the times of refreshing shall come from the presence of the Lord.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/acts/3?lang=eng",
    },
    bom: {
      reference: "Alma 34:32-33",
      text: "For behold, this life is the time for men to prepare to meet God; yea, behold the day of this life is the day for men to perform their labors. And now, as I said unto you before, as ye have had so many witnesses, therefore, I beseech of you that ye do not procrastinate the day of your repentance until the end.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/34?lang=eng",
    },
    talk: {
      title: "The Divine Gift of Repentance",
      speaker: "D. Todd Christofferson",
      year: "October 2011",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2011/10/the-divine-gift-of-repentance?lang=eng",
    },
  },
  {
    id: "prayer",
    title: "Prayer",
    summary: "Ask, seek, knock — and He will answer.",
    tags: ["prayer", "guidance", "decisions"],
    bible: {
      reference: "Matthew 7:7-8",
      text: "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you: For every one that asketh receiveth; and he that seeketh findeth; and to him that knocketh it shall be opened.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/matt/7?lang=eng",
    },
    bom: {
      reference: "Alma 34:27",
      text: "Yea, and when you do not cry unto the Lord, let your hearts be full, drawn out in prayer unto him continually for your welfare, and also for the welfare of those who are around you.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/34?lang=eng",
    },
    talk: {
      title: "Does God Really Hear Prayers?",
      speaker: "Russell M. Nelson",
      year: "April 2016",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2016/04/a-plea-to-my-sisters?lang=eng",
    },
  },
  {
    id: "patience",
    title: "Patience",
    summary: "Time and trust — the Lord's timing is perfect.",
    tags: ["patience", "waiting", "endurance"],
    bible: {
      reference: "Romans 12:12",
      text: "Rejoicing in hope; patient in tribulation; continuing instant in prayer.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/rom/12?lang=eng",
    },
    bom: {
      reference: "Mosiah 3:19",
      text: "For the natural man is an enemy to God, and has been from the fall of Adam, and will be, forever and ever, unless he yields to the enticings of the Holy Spirit, and putteth off the natural man and becometh a saint through the atonement of Christ the Lord, and becometh as a child, submissive, meek, humble, patient, full of love.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/mosiah/3?lang=eng",
    },
    talk: {
      title: "Continue in Patience",
      speaker: "Dieter F. Uchtdorf",
      year: "April 2010",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2010/04/continue-in-patience?lang=eng",
    },
  },
  {
    id: "forgiveness",
    title: "Forgiveness",
    summary: "Let it go. Be kind. Forgive as He forgives you.",
    tags: ["forgiveness", "anger", "resentment", "relationships"],
    bible: {
      reference: "Ephesians 4:32",
      text: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/eph/4?lang=eng",
    },
    bom: {
      reference: "3 Nephi 13:14-15",
      text: "For, if ye forgive men their trespasses your heavenly Father will also forgive you; But if ye forgive not men their trespasses neither will your Father forgive your trespasses.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/3-ne/13?lang=eng",
    },
    talk: {
      title: "The Merciful Obtain Mercy",
      speaker: "Dieter F. Uchtdorf",
      year: "April 2012",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2012/04/the-merciful-obtain-mercy?lang=eng",
    },
  },
  {
    id: "trials",
    title: "Trials & Endurance",
    summary: "Trust Him through the hard days — He is supporting you.",
    tags: ["trials", "hardship", "suffering", "endurance", "low-mood"],
    bible: {
      reference: "James 1:2-4",
      text: "My brethren, count it all joy when ye fall into divers temptations; Knowing this, that the trying of your faith worketh patience. But let patience have her perfect work, that ye may be perfect and entire, wanting nothing.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/james/1?lang=eng",
    },
    bom: {
      reference: "Alma 36:3",
      text: "I do know that whosoever shall put their trust in God shall be supported in their trials, and their troubles, and their afflictions, and shall be lifted up at the last day.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/36?lang=eng",
    },
    talk: {
      title: "The Atonement Covers All Pain",
      speaker: "Kent F. Richards",
      year: "April 2011",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2011/04/the-atonement-covers-all-pain?lang=eng",
    },
  },
  {
    id: "humility",
    title: "Humility",
    summary: "Weakness becomes strength when we come unto Him.",
    tags: ["humility", "pride", "weakness", "learning"],
    bible: {
      reference: "James 4:10",
      text: "Humble yourselves in the sight of the Lord, and he shall lift you up.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/james/4?lang=eng",
    },
    bom: {
      reference: "Ether 12:27",
      text: "And if men come unto me I will show unto them their weakness. I give unto men weakness that they may be humble; and my grace is sufficient for all men that humble themselves before me; for if they humble themselves before me, and have faith in me, then will I make weak things become strong unto them.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/ether/12?lang=eng",
    },
    talk: {
      title: "Beware of Pride",
      speaker: "Ezra Taft Benson",
      year: "April 1989",
      url: "https://www.churchofjesuschrist.org/study/general-conference/1989/04/beware-of-pride?lang=eng",
    },
  },
  {
    id: "scripture-study",
    title: "Feast Upon His Word",
    summary: "The scriptures are not to be read — they are to be feasted upon.",
    tags: ["scripture", "learning", "study", "words"],
    bible: {
      reference: "2 Timothy 3:16",
      text: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/nt/2-tim/3?lang=eng",
    },
    bom: {
      reference: "2 Nephi 32:3",
      text: "Feast upon the words of Christ; for behold, the words of Christ will tell you all things what ye should do.",
      url: "https://www.churchofjesuschrist.org/study/scriptures/bofm/2-ne/32?lang=eng",
    },
    talk: {
      title: "Become a Disciple of Jesus Christ",
      speaker: "Robert D. Hales",
      year: "October 2017",
      url: "https://www.churchofjesuschrist.org/study/general-conference/2017/10/becoming-a-disciple-of-our-lord-jesus-christ?lang=eng",
    },
  },
];

// --- Helpers ---

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Pick theme id for a given day based on user data
export function selectThemeForDay(data: AppData, todayStr: string): SpiritualTheme {
  // Build tag scores from user data
  const scores: Record<string, number> = {};
  const bump = (tag: string, amount = 1) => { scores[tag] = (scores[tag] || 0) + amount; };

  // Mood signals (low mood → hope, peace, trials)
  const recentMoods = data.journal.filter((j) => j.mood && daysBetween(j.date, todayStr) <= 7).map((j) => j.mood!);
  const journalMoods = (data.journalLogs || []).filter((j) => j.mood && daysBetween(j.date, todayStr) <= 7).map((j) => j.mood!);
  const allMoods = [...recentMoods, ...journalMoods];
  const avgMood = allMoods.length > 0 ? allMoods.reduce((a, b) => a + b, 0) / allMoods.length : 3;

  if (avgMood < 3) {
    bump("hope", 3); bump("peace", 3); bump("low-mood", 3); bump("comfort", 2);
  } else if (avgMood >= 4) {
    bump("gratitude", 2); bump("joy", 2);
  }

  // Relationship signals
  const wife = data.people.find((p) => p.relationship === "wife");
  if (wife) {
    const wifeDays = wife.lastContact ? daysBetween(wife.lastContact, todayStr) : 999;
    if (wifeDays >= 3) {
      bump("marriage", 4); bump("wife", 3); bump("love", 2);
    }
  }

  const overdueKids = data.people.filter((p) => {
    if (p.relationship !== "child") return false;
    const d = p.lastContact ? daysBetween(p.lastContact, todayStr) : 999;
    return d >= 2;
  });
  if (overdueKids.length > 0) {
    bump("fatherhood", 4); bump("kids", 3); bump("family", 2);
  }

  const overdueElders = data.people.filter((p) => {
    if (p.relationship !== "parent" && p.relationship !== "grandparent") return false;
    const d = p.lastContact ? daysBetween(p.lastContact, todayStr) : 999;
    return d >= p.contactFrequency;
  });
  if (overdueElders.length > 0) {
    bump("family", 3); bump("love", 2);
  }

  // Gratitude frequency
  const recentJournal = (data.journalLogs || []).filter((j) => daysBetween(j.date, todayStr) <= 7);
  const gratitudeCount = recentJournal.filter((j) => j.category === "gratitude").length;
  if (gratitudeCount === 0) bump("gratitude", 3);

  // Service frequency
  const serviceCount = recentJournal.filter((j) => j.category === "service").length;
  if (serviceCount === 0) bump("service", 3); else bump("service", 1);

  // Habit consistency (low → patience/endurance)
  const dailyHabits = data.habits.filter((h) => h.frequency === "daily");
  const last7HabitLogs = data.habitLogs.filter((l) => l.completed && daysBetween(l.date, todayStr) <= 7);
  const habitRate = dailyHabits.length > 0 ? last7HabitLogs.length / (dailyHabits.length * 7) : 1;
  if (habitRate < 0.5) {
    bump("patience", 3); bump("endurance", 2);
  }

  // Recently read themes (don't repeat last 14 days)
  const readLogs = (data.journalLogs || []).filter(
    (j) => j.nudgeType === "scripture-daily" && daysBetween(j.date, todayStr) <= 14
  );
  const recentlyRead = new Set(readLogs.map((j) => j.content));

  // Score each theme
  const themeScores = THEMES.map((t) => {
    const dataScore = t.tags.reduce((sum, tag) => sum + (scores[tag] || 0), 0);
    // Deterministic tie-breaker based on theme id + date
    const tieBreaker = hashStr(t.id + todayStr) % 100 / 100;
    const penalty = recentlyRead.has(t.id) ? -100 : 0;
    return { theme: t, score: dataScore + tieBreaker + penalty };
  });

  themeScores.sort((a, b) => b.score - a.score);
  return themeScores[0].theme;
}

export function wasScriptureReadToday(data: AppData, todayStr: string): boolean {
  return (data.journalLogs || []).some(
    (j) => j.date === todayStr && j.nudgeType === "scripture-daily"
  );
}
