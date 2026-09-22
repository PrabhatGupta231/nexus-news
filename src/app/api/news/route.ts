import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { LIVE_FEED_URLS, Category, getHistoricalArchiveUrl } from '@/config/feeds';

export const revalidate = 600;

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure', 'content:encoded', 'description'],
  },
});

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
  thumbnail: string | null;
  category: string;
}

function decodeHTMLEntities(text: string) {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&lt;': '<',
    '&gt;': '>',
    '&#39;': "'",
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
    '&mdash;': '-',
    '&ndash;': '-',
  };
  return text.replace(/&[a-zA-Z0-9#]+;/g, (match) => entities[match] || match);
}

function processSnippet(rawText: string): string {
  if (!rawText) return '';
  let text = rawText.replace(/<[^>]*>?/gm, ''); // strip html
  text = decodeHTMLEntities(text).trim();
  return text.length > 120 ? text.substring(0, 117) + '...' : text;
}

function resolveContextualImage(title: string, category: string): string {
  const t = title.toLowerCase();
  
  if (t.match(/\b(health|hospital|medical|doctor|disease|virus|medicine)\b/)) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80';
  }
  if (t.match(/\b(aviation|aerodrome|flight|airport|airplane|airline|aircraft)\b/)) {
    return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80';
  }
  if (t.match(/\b(minister|cabinet|yojana|govt|government|mantri|parliament|lok\ssabha|rajya\ssabha|modi|bjp|congress|governance|policy)\b/)) {
    return 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80';
  }
  if (t.match(/\b(art|heritage|culture|museum|festival|tradition)\b/)) {
    return 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80';
  }
  if (t.match(/\b(economy|bank|finance|business|banking|market|sensex|nifty|gdp|inflation|trade|tax|udyog)\b/)) {
    return 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80';
  }
  if (t.match(/\b(defence|military|army|navy|security|tactical|missile|soldier|troop|border)\b/)) {
    return 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80';
  }
  
  // Rotating Default Fallbacks based on title hash
  const fallbacks = [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80"
  ];
  
  const hash = Math.abs(title.split('').reduce((a, b) => a + b.charCodeAt(0), 0));
  return fallbacks[hash % fallbacks.length];
}

function isValidImage(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'null' || url === 'undefined') return false;
  const lurl = url.toLowerCase();
  if (lurl.includes('feedburner') || lurl.includes('1x1') || lurl.includes('pixel')) {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

function isImageExtension(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.png') || lowerUrl.endsWith('.webp') || lowerUrl.includes('.jpg?') || lowerUrl.includes('.jpeg?') || lowerUrl.includes('.png?') || lowerUrl.includes('.webp?');
}

async function fetchOpenGraphImage(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout as requested

    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' } });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    let imgUrl = $('meta[property="og:image"]').attr('content') || 
                 $('meta[name="twitter:image"]').attr('content') ||
                 $('img#imgid').attr('src') || 
                 $('.full-img img').attr('src');

    if (imgUrl) {
      try {
        return new URL(imgUrl, url).href;
      } catch (e) {
        return imgUrl;
      }
    }
  } catch (err) {
    // Timeout or network error
  }
  return null;
}

async function extractImage(item: any, title: string, category: string): Promise<string> {
  let extractedUrl: string | null = null;
  
  if (item['media:content'] && item['media:content']['$'] && item['media:content']['$']['url']) {
    extractedUrl = item['media:content']['$']['url'];
  } else if (item['media:thumbnail'] && item['media:thumbnail']['$'] && item['media:thumbnail']['$']['url']) {
    extractedUrl = item['media:thumbnail']['$']['url'];
  } else if (item.enclosure && item.enclosure.url && isImageExtension(item.enclosure.url)) {
    extractedUrl = item.enclosure.url;
  } else {
    const htmlContent = item['content:encoded'] || item.description || '';
    const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      extractedUrl = imgMatch[1];
    }
  }
  
  if (isValidImage(extractedUrl)) {
    return extractedUrl as string;
  }
  
  // Try to scrape OG Image from real article URL
  if (item.link) {
    const ogImage = await fetchOpenGraphImage(item.link);
    if (isValidImage(ogImage)) {
      return ogImage as string;
    }
  }
  
  return resolveContextualImage(title, category);
}

// Helper to slugify titles for deduplication
function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryParam = (searchParams.get('category') as Category) || 'all';
  const dateStr = searchParams.get('date');
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isPastDate = dateStr && dateStr !== todayStr;

  let allItems: NewsItem[] = [];
  const counts = { all: 0, upsc: 0, economy: 0, science: 0, world: 0 };
  const lastUpdated = new Date().toISOString();

  try {
    if (isPastDate) {
      // Historical Archive Mode
      const url = getHistoricalArchiveUrl(categoryParam, dateStr!);
      const feed = await parser.parseURL(url);
      const source = new URL(url).hostname;
      
      const itemPromises = feed.items.map(async (item) => {
        const rawSnippet = item.description || item.contentSnippet || item['content:encoded'] || '';
        const articleTitle = item.title ? decodeHTMLEntities(item.title) : 'No Title';
        const articleCat = categoryParam === 'all' ? 'general' : categoryParam;
        
        return {
          id: item.guid || item.link || String(Math.random()),
          title: articleTitle,
          link: item.link || '#',
          pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          source: feed.title || source,
          snippet: processSnippet(rawSnippet),
          thumbnail: await extractImage(item, articleTitle, articleCat),
          category: articleCat,
        };
      });
      
      const itemsSettled = await Promise.allSettled(itemPromises);
      allItems = itemsSettled.filter(p => p.status === 'fulfilled').map(p => (p as PromiseFulfilledResult<NewsItem>).value);
      
      counts.all = allItems.length;
      if (categoryParam !== 'all') {
        counts[categoryParam as keyof typeof counts] = allItems.length;
      }
    } else {
      // Live Mode: Fetch ALL feeds for the 4 core categories
      const categoriesToFetch: (keyof typeof LIVE_FEED_URLS)[] = ['upsc', 'economy', 'science', 'world'];
      
      const fetchPromises = categoriesToFetch.flatMap(cat => {
        const urls = LIVE_FEED_URLS[cat];
        return urls.map(url => 
          parser.parseURL(url).then(feed => ({ feed, source: new URL(url).hostname, category: cat }))
        );
      });

      const results = await Promise.allSettled(fetchPromises);
      let parsePromises: Promise<NewsItem>[] = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { feed, source, category } = result.value;
          
          feed.items.forEach((item) => {
            const rawSnippet = item.description || item.contentSnippet || item['content:encoded'] || '';
            const articleTitle = item.title ? decodeHTMLEntities(item.title) : 'No Title';
            
            parsePromises.push(
              extractImage(item, articleTitle, category).then(thumbnail => ({
                id: item.guid || item.link || String(Math.random()),
                title: articleTitle,
                link: item.link || '#',
                pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                source: feed.title || source,
                snippet: processSnippet(rawSnippet),
                thumbnail,
                category: category,
              }))
            );
          });
        }
      });
      
      const allParsedItemsSettled = await Promise.allSettled(parsePromises);
      allItems = allParsedItemsSettled.filter(p => p.status === 'fulfilled').map(p => (p as PromiseFulfilledResult<NewsItem>).value);

      // Deduplicate using slugified matching
      const seenSlugs = new Set<string>();
      const uniqueItems = allItems.filter((item) => {
        const slug = slugify(item.title);
        if (seenSlugs.has(slug)) return false;
        seenSlugs.add(slug);
        return true;
      });
      
      allItems = uniqueItems;
      allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      // Calculate true counts
      counts.all = allItems.length;
      counts.upsc = allItems.filter(i => i.category === 'upsc').length;
      counts.economy = allItems.filter(i => i.category === 'economy').length;
      counts.science = allItems.filter(i => i.category === 'science').length;
      counts.world = allItems.filter(i => i.category === 'world').length;

      // Filter if a specific category was requested
      if (categoryParam !== 'all') {
        allItems = allItems.filter(i => i.category === categoryParam);
      }
    }

    return NextResponse.json({
      counts,
      lastUpdated,
      articles: allItems
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to aggregate news' }, { status: 500 });
  }
}
