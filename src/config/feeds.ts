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
    { url: 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1', lang: 'en' },
    { url: 'https://www.thehindu.com/news/national/feeder/default.rss', lang: 'en' },
    { url: 'https://indianexpress.com/section/explained/feed/', lang: 'en' }
  ],
  economy: [
    { url: 'https://www.thehindubusinessline.com/economy/feeder/default.rss', lang: 'en' },
    { url: 'https://www.livemint.com/rss/economy', lang: 'en' },
    { url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en', lang: 'en' }
  ],
  science: [
    { url: 'https://www.thehindu.com/sci-tech/science/feeder/default.rss', lang: 'en' },
    { url: 'https://www.downtoearth.org.in/rss', lang: 'en' }
  ],
  world: [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', lang: 'en' },
    { url: 'https://www.thehindu.com/news/international/feeder/default.rss', lang: 'en' }
  ]
};

export const STATE_FEEDS: Record<string, { url: string; lang: 'en' | 'hi' }[]> = {
  'uttar-pradesh': [{ url: 'https://news.google.com/rss/search?q=location:uttar+pradesh+when:2d&hl=hi&gl=IN&ceid=IN:hi', lang: 'hi' }],
  'bihar': [{ url: 'https://news.google.com/rss/search?q=location:bihar+when:2d&hl=hi&gl=IN&ceid=IN:hi', lang: 'hi' }],
  'madhya-pradesh': [{ url: 'https://news.google.com/rss/search?q=location:madhya+pradesh+when:2d&hl=hi&gl=IN&ceid=IN:hi', lang: 'hi' }],
  'delhi-ncr': [{ url: 'https://news.google.com/rss/search?q=location:delhi+when:2d&hl=hi&gl=IN&ceid=IN:hi', lang: 'hi' }],
};

export const STATE_NAMES: Record<string, string> = {
  'uttar-pradesh': 'Uttar Pradesh',
  'bihar': 'Bihar',
  'madhya-pradesh': 'Madhya Pradesh',
  'delhi-ncr': 'Delhi NCR',
};

export const CITY_FEEDS: Record<string, { name: string; url: string; hindiName: string; lang: 'en' | 'hi' }[]> = {
  "lucknow": [
    { name: "Amar Ujala Lucknow", url: "https://www.amarujala.com/rss/lucknow.xml", hindiName: "लखनऊ", lang: 'hi' },
    { name: "Jagran Lucknow", url: "https://rss.jagran.com/rss/uttar-pradesh/lucknow.xml", hindiName: "लखनऊ", lang: 'hi' }
  ],
  "varanasi": [
    { name: "Amar Ujala Varanasi", url: "https://www.amarujala.com/rss/varanasi.xml", hindiName: "वाराणसी", lang: 'hi' },
    { name: "Jagran Varanasi", url: "https://rss.jagran.com/rss/uttar-pradesh/varanasi.xml", hindiName: "वाराणसी", lang: 'hi' }
  ],
  "prayagraj": [
    { name: "Amar Ujala Prayagraj", url: "https://www.amarujala.com/rss/allahabad.xml", hindiName: "प्रयागराज", lang: 'hi' },
    { name: "Jagran Prayagraj", url: "https://rss.jagran.com/rss/uttar-pradesh/allahabad.xml", hindiName: "प्रयागराज", lang: 'hi' }
  ],
  "kanpur": [
    { name: "Amar Ujala Kanpur", url: "https://www.amarujala.com/rss/kanpur.xml", hindiName: "कानपुर", lang: 'hi' },
    { name: "Jagran Kanpur", url: "https://rss.jagran.com/rss/uttar-pradesh/kanpur.xml", hindiName: "कानपुर", lang: 'hi' }
  ]
};

export const PIB_HINDI_FALLBACK = [{ url: 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=2', lang: 'hi' }];

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
