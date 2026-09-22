export type Category = 'all' | 'upsc' | 'current-affairs' | 'economy' | 'science' | 'world';

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
