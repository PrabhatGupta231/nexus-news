export type Category = 'all' | 'upsc' | 'current-affairs' | 'entertainment' | 'economy' | 'science' | 'world' | 'state-news';

export const NEWS_CATEGORIES = [
  { id: 'all', label: 'All Headlines' },
  { id: 'upsc', label: 'UPSC / Geopolitics' },
  { id: 'current-affairs', label: 'CURRENT AFFAIRS' },
  { id: 'entertainment', label: 'CINEMA & ENTERTAINMENT' },
  { id: 'economy', label: 'Economy & Corporate' },
  { id: 'science', label: 'Science & Ecology' },
  { id: 'world', label: 'World Affairs' },
];

export interface FeedConfig {
  name: string;
  url: string;
  category: Category | string;
  state?: string;
  city?: string;
}

export const ENGLISH_FEEDS: FeedConfig[] = [
  { name: "The Hindu National", url: "https://www.thehindu.com/news/national/feeder/default.rss", category: "upsc" },
  { name: "Indian Express Explained", url: "https://indianexpress.com/section/explained/feed/", category: "upsc" },
  { name: "PIB English Dispatches", url: "https://pib.gov.in/RssMain.aspx?ModId=6&LangId=1", category: "current-affairs" },
  { name: "LiveMint Economy", url: "https://www.livemint.com/rss/economy", category: "economy" },
  { name: "BBC World News", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "world" },
  { name: "NDTV Top Stories", url: "https://feeds.feedburner.com/ndtvnews-top-stories", category: "current-affairs" },
  { name: "Google News Entertainment", url: "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en", category: "entertainment" },
  { name: "Bollywood Hungama", url: "https://www.bollywoodhungama.com/rss/news.xml", category: "entertainment" },
  { name: "NDTV Movies", url: "https://feeds.feedburner.com/ndtvmovies-latest", category: "entertainment" }
];

export const HINDI_FEEDS: FeedConfig[] = [
  { name: "PIB हिन्दी", url: "https://pib.gov.in/RssMain.aspx?ModId=6&LangId=2", category: "upsc" },
  { name: "अमर उजाला राष्ट्रीय", url: "https://www.amarujala.com/rss/national-news.xml", category: "current-affairs" },
  { name: "दैनिक जागरण", url: "https://rss.jagran.com/rss/news/national.xml", category: "current-affairs" },
  { name: "अमर उजाला उत्तर प्रदेश", url: "https://www.amarujala.com/rss/lucknow.xml", category: "state-news", state: "uttar-pradesh" },
  { name: "Google News Entertainment", url: "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=hi&gl=IN&ceid=IN:hi", category: "entertainment" }
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
  else if (category === 'entertainment') query = 'India Entertainment Bollywood Cinema';
  else if (category === 'economy') query = 'India Economy';
  else if (category === 'science') query = 'India Science Environment';
  else if (category === 'world') query = 'World International Affairs';

  const ce = lang === 'en' ? `ceid=IN:en&hl=en-IN&gl=IN` : `ceid=IN:hi&hl=hi&gl=IN`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+before:${dateStr}+after:${dateStr}&${ce}`;
}
