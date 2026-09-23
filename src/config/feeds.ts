export type Category = 'all' | 'upsc' | 'current-affairs' | 'economy' | 'science' | 'world' | 'state-news';

export const NEWS_CATEGORIES = [
  { id: 'all', label: 'All Headlines' },
  { id: 'upsc', label: 'UPSC / Geopolitics' },
  { id: 'current-affairs', label: 'CURRENT AFFAIRS' },
  { id: 'economy', label: 'Economy & Corporate' },
  { id: 'science', label: 'Science & Ecology' },
  { id: 'world', label: 'World Affairs' },
];

export const FEEDS = [
  // --- ACTUAL ENGLISH FEEDS ---
  { name: "The Hindu National", url: "https://www.thehindu.com/news/national/feeder/default.rss", category: "upsc", lang: "en" },
  { name: "Indian Express UPSC", url: "https://indianexpress.com/section/explained/feed/", category: "upsc", lang: "en" },
  { name: "PIB English", url: "https://pib.gov.in/RssMain.aspx?ModId=6&LangId=1", category: "upsc", lang: "en" },
  { name: "LiveMint Economy", url: "https://www.livemint.com/rss/economy", category: "economy", lang: "en" },
  { name: "Hindu Business Line", url: "https://www.thehindubusinessline.com/economy/feeder/default.rss", category: "economy", lang: "en" },
  { name: "Google Business EN", url: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en", category: "economy", lang: "en" },
  { name: "Hindu Science", url: "https://www.thehindu.com/sci-tech/science/feeder/default.rss", category: "science", lang: "en" },
  { name: "Down To Earth", url: "https://www.downtoearth.org.in/rss", category: "science", lang: "en" },
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "world", lang: "en" },
  { name: "Hindu International", url: "https://www.thehindu.com/news/international/feeder/default.rss", category: "world", lang: "en" },

  // --- ACTUAL HINDI FEEDS ---
  { name: "PIB हिन्दी", url: "https://pib.gov.in/RssMain.aspx?ModId=6&LangId=2", category: "upsc", lang: "hi" },
  { name: "अमर उजाला राष्ट्रीय", url: "https://www.amarujala.com/rss/national-news.xml", category: "current-affairs", lang: "hi" },
  { name: "दैनिक जागरण", url: "https://rss.jagran.com/rss/news/national.xml", category: "current-affairs", lang: "hi" },
  { name: "Google Business HI", url: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=hi&gl=IN&ceid=IN:hi", category: "economy", lang: "hi" },
  { name: "Google Science HI", url: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=hi&gl=IN&ceid=IN:hi", category: "science", lang: "hi" },
  { name: "Google World HI", url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=hi&gl=IN&ceid=IN:hi", category: "world", lang: "hi" },
  
  // State Dispatches (Hindi)
  { name: "Google UP", url: "https://news.google.com/rss/search?q=location:uttar+pradesh+when:2d&hl=hi&gl=IN&ceid=IN:hi", category: "state-news", state: "uttar-pradesh", lang: "hi" },
  { name: "Google Bihar", url: "https://news.google.com/rss/search?q=location:bihar+when:2d&hl=hi&gl=IN&ceid=IN:hi", category: "state-news", state: "bihar", lang: "hi" },
  { name: "Google MP", url: "https://news.google.com/rss/search?q=location:madhya+pradesh+when:2d&hl=hi&gl=IN&ceid=IN:hi", category: "state-news", state: "madhya-pradesh", lang: "hi" },
  { name: "Google Delhi", url: "https://news.google.com/rss/search?q=location:delhi+when:2d&hl=hi&gl=IN&ceid=IN:hi", category: "state-news", state: "delhi-ncr", lang: "hi" },
  
  // City Feeds (Hindi)
  { name: "Amar Ujala Lucknow", url: "https://www.amarujala.com/rss/lucknow.xml", category: "state-news", state: "uttar-pradesh", city: "lucknow", lang: "hi" },
  { name: "Jagran Lucknow", url: "https://rss.jagran.com/rss/uttar-pradesh/lucknow.xml", category: "state-news", state: "uttar-pradesh", city: "lucknow", lang: "hi" },
  { name: "Amar Ujala Varanasi", url: "https://www.amarujala.com/rss/varanasi.xml", category: "state-news", state: "uttar-pradesh", city: "varanasi", lang: "hi" },
  { name: "Jagran Varanasi", url: "https://rss.jagran.com/rss/uttar-pradesh/varanasi.xml", category: "state-news", state: "uttar-pradesh", city: "varanasi", lang: "hi" },
  { name: "Amar Ujala Prayagraj", url: "https://www.amarujala.com/rss/allahabad.xml", category: "state-news", state: "uttar-pradesh", city: "prayagraj", lang: "hi" },
  { name: "Jagran Prayagraj", url: "https://rss.jagran.com/rss/uttar-pradesh/allahabad.xml", category: "state-news", state: "uttar-pradesh", city: "prayagraj", lang: "hi" },
  { name: "Amar Ujala Kanpur", url: "https://www.amarujala.com/rss/kanpur.xml", category: "state-news", state: "uttar-pradesh", city: "kanpur", lang: "hi" },
  { name: "Jagran Kanpur", url: "https://rss.jagran.com/rss/uttar-pradesh/kanpur.xml", category: "state-news", state: "uttar-pradesh", city: "kanpur", lang: "hi" }
];

export const STATE_NAMES: Record<string, string> = {
  'uttar-pradesh': 'Uttar Pradesh',
  'bihar': 'Bihar',
  'madhya-pradesh': 'Madhya Pradesh',
  'delhi-ncr': 'Delhi NCR',
};

export function getHistoricalArchiveUrl(category: Category, dateStr: string, lang: 'en'|'hi' = 'en'): string {
  let query = 'India';
  
  if (category === 'upsc') query = 'India National';
  else if (category === 'current-affairs') query = 'India Current Affairs';
  else if (category === 'economy') query = 'India Economy';
  else if (category === 'science') query = 'India Science Environment';
  else if (category === 'world') query = 'World International Affairs';

  const ce = lang === 'en' ? `ceid=IN:en&hl=en-IN&gl=IN` : `ceid=IN:hi&hl=hi&gl=IN`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+before:${dateStr}+after:${dateStr}&${ce}`;
}
