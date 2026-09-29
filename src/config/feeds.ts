export type Category = 'all' | 'upsc' | 'current-affairs' | 'economy' | 'science' | 'world' | 'state-news';

export const NEWS_CATEGORIES = [
  { id: 'all', label: 'All Headlines' },
  { id: 'upsc', label: 'UPSC / Geopolitics' },
  { id: 'current-affairs', label: 'CURRENT AFFAIRS' },
  { id: 'economy', label: 'Economy & Corporate' },
  { id: 'science', label: 'Science & Ecology' },
  { id: 'world', label: 'World Affairs' },
];

export const ENGLISH_FEEDS = [
  { name: "The Hindu National", url: "https://www.thehindu.com/news/national/feeder/default.rss", category: "upsc" },
  { name: "Indian Express Explained", url: "https://indianexpress.com/section/explained/feed/", category: "upsc" },
  { name: "PIB English Dispatches", url: "https://pib.gov.in/RssMain.aspx?ModId=6&LangId=1", category: "current-affairs" },
  { name: "LiveMint Economy", url: "https://www.livemint.com/rss/economy", category: "economy" },
  { name: "BBC World News", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "world" },
  { name: "NDTV Top Stories", url: "https://feeds.feedburner.com/ndtvnews-top-stories", category: "current-affairs" }
];

export const HINDI_FEEDS = [
  { name: "PIB हिन्दी", url: "https://pib.gov.in/RssMain.aspx?ModId=6&LangId=2", category: "upsc" },
  { name: "अमर उजाला राष्ट्रीय", url: "https://www.amarujala.com/rss/national-news.xml", category: "current-affairs" },
  { name: "दैनिक जागरण", url: "https://rss.jagran.com/rss/news/national.xml", category: "current-affairs" },
  { name: "अमर उजाला उत्तर प्रदेश", url: "https://www.amarujala.com/rss/lucknow.xml", category: "state-news", state: "uttar-pradesh" }
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
