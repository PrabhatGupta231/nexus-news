export type Category = 'all' | 'upsc' | 'current-affairs' | 'economy' | 'science' | 'world' | 'state-news';

export const NEWS_CATEGORIES = [
  { id: 'all', label: 'All Headlines' },
  { id: 'upsc', label: 'UPSC / Geopolitics' },
  { id: 'current-affairs', label: 'CURRENT AFFAIRS' },
  { id: 'economy', label: 'Economy & Corporate' },
  { id: 'science', label: 'Science & Ecology' },
  { id: 'world', label: 'World Affairs' },
];

export const LIVE_FEED_URLS = {
  upsc: [
    'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1',
    'https://www.thehindu.com/news/national/feeder/default.rss',
    'https://indianexpress.com/section/explained/feed/'
  ],
  economy: [
    'https://www.thehindubusinessline.com/economy/feeder/default.rss',
    'https://www.livemint.com/rss/economy',
    'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en'
  ],
  science: [
    'https://www.thehindu.com/sci-tech/science/feeder/default.rss',
    'https://www.downtoearth.org.in/rss'
  ],
  world: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.thehindu.com/news/international/feeder/default.rss'
  ]
};

export const STATE_FEEDS: Record<string, string[]> = {
  'uttar-pradesh': ['https://news.google.com/rss/search?q=location:uttar+pradesh+when:2d&hl=hi&gl=IN&ceid=IN:hi'],
  'bihar': ['https://news.google.com/rss/search?q=location:bihar+when:2d&hl=hi&gl=IN&ceid=IN:hi'],
  'madhya-pradesh': ['https://news.google.com/rss/search?q=location:madhya+pradesh+when:2d&hl=hi&gl=IN&ceid=IN:hi'],
  'delhi-ncr': ['https://news.google.com/rss/search?q=location:delhi+when:2d&hl=hi&gl=IN&ceid=IN:hi'],
};

export const STATE_NAMES: Record<string, string> = {
  'uttar-pradesh': 'Uttar Pradesh',
  'bihar': 'Bihar',
  'madhya-pradesh': 'Madhya Pradesh',
  'delhi-ncr': 'Delhi NCR',
};

export const CITY_FEEDS: Record<string, { name: string; url: string; hindiName: string }[]> = {
  "lucknow": [
    { name: "Amar Ujala Lucknow", url: "https://www.amarujala.com/rss/lucknow.xml", hindiName: "लखनऊ" },
    { name: "Jagran Lucknow", url: "https://rss.jagran.com/rss/uttar-pradesh/lucknow.xml", hindiName: "लखनऊ" }
  ],
  "varanasi": [
    { name: "Amar Ujala Varanasi", url: "https://www.amarujala.com/rss/varanasi.xml", hindiName: "वाराणसी" },
    { name: "Jagran Varanasi", url: "https://rss.jagran.com/rss/uttar-pradesh/varanasi.xml", hindiName: "वाराणसी" }
  ],
  "prayagraj": [
    { name: "Amar Ujala Prayagraj", url: "https://www.amarujala.com/rss/allahabad.xml", hindiName: "प्रयागराज" },
    { name: "Jagran Prayagraj", url: "https://rss.jagran.com/rss/uttar-pradesh/allahabad.xml", hindiName: "प्रयागराज" }
  ],
  "kanpur": [
    { name: "Amar Ujala Kanpur", url: "https://www.amarujala.com/rss/kanpur.xml", hindiName: "कानपुर" },
    { name: "Jagran Kanpur", url: "https://rss.jagran.com/rss/uttar-pradesh/kanpur.xml", hindiName: "कानपुर" }
  ]
};

export const PIB_HINDI_FALLBACK = ['https://pib.gov.in/RssMain.aspx?ModId=6&Lang=2'];

export function getHistoricalArchiveUrl(category: Category, dateStr: string): string {
  // Google News search bounded by dates
  let query = 'India';
  
  if (category === 'upsc') query = 'India National';
  else if (category === 'current-affairs') query = 'India Current Affairs';
  else if (category === 'economy') query = 'India Economy';
  else if (category === 'science') query = 'India Science Environment';
  else if (category === 'world') query = 'World International Affairs';

  const ce = `ceid=IN:en&hl=en-IN&gl=IN`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+before:${dateStr}+after:${dateStr}&${ce}`;
}
