import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { FEEDS, Category, getHistoricalArchiveUrl, STATE_NAMES } from '@/config/feeds';

export const revalidate = 600;


const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure', 'content:encoded', 'description', 'source'],
  },
});

const globalCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchFeed(url: string, timeoutMs: number = 2500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return await parser.parseString(text);
  } finally {
    clearTimeout(id);
  }
}


export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
  thumbnail: string | null;
  category: string;
  stateName?: string;
  lang?: 'en' | 'hi';
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



function isValidImage(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'null' || url === 'undefined') return false;
  const lurl = url.toLowerCase();
  if (lurl.includes('feedburner') || lurl.includes('1x1') || lurl.includes('pixel')) {
    return false;
  }
  if (lurl.includes('google.com') || lurl.includes('googleusercontent.com') || lurl.includes('/logos/') || lurl.includes('/branding/')) {
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

async function extractImage(item: any, title: string, category: string): Promise<string | null> {
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
  
  return null;
}

// Auto-tagging engine for Current Affairs
function isCurrentAffairs(title: string, snippet: string): boolean {
  const text = (title + ' ' + snippet).toLowerCase();
  const keywords = ["scheme", "yojana", "mou", "bilateral", "summit", "gdp", "isro", "drdo", "cabinet", "policy", "amendment", "defence exercise", "अभ्यास", "योजना", "समझौता", "शिखर सम्मेलन", "सहमति पत्र", "करेंट अफेयर्स"];
  return keywords.some(kw => text.includes(kw));
}

function extractSourceName(item: any, feedTitle: string, fallback: string, stateName?: string): string {
  let src = '';
  if (item.source) {
    if (typeof item.source === 'string') {
      src = item.source;
    } else if (typeof item.source === 'object' && item.source._) {
      src = item.source._;
    }
  }
  
  if (!src) {
    src = feedTitle || fallback;
  }

  const upperSrc = src.toUpperCase();
  if (upperSrc.includes('LOCATION:') || upperSrc.includes('WHEN:') || upperSrc.includes('GOOGLE NEWS') || upperSrc.includes('GOOGLE समाचार')) {
    if (stateName) {
      if (stateName.toUpperCase() === 'UTTAR PRADESH' || stateName.toUpperCase() === 'UP') return 'UP REGIONAL DESK';
      return `${stateName.toUpperCase()} REGIONAL DESK`;
    }
    return 'REGIONAL DESK';
  }
  
  return src;
}

// Helper to slugify titles for deduplication
function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cacheKey = searchParams.toString();
  const now = Date.now();

  if (globalCache[cacheKey] && now - globalCache[cacheKey].timestamp < CACHE_TTL) {
    return NextResponse.json(globalCache[cacheKey].data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  }

  const categoryParam = (searchParams.get('category') as Category | 'state-news') || 'all';
  const stateParam = searchParams.get('state');
  const cityParam = searchParams.get('city');
  const dateStr = searchParams.get('date');
  const locationParam = searchParams.get('location');
  const langParam = (searchParams.get('lang') as 'en' | 'hi') || 'en';
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isPastDate = dateStr && dateStr !== todayStr;

  let allItems: NewsItem[] = [];
  const counts: Record<string, number> = { all: 0, upsc: 0, 'current-affairs': 0, economy: 0, science: 0, world: 0, 'state-news': 0 };
  const lastUpdated = new Date().toISOString();

  try {
    if (isPastDate) {
      // Historical Archive Mode
      const url = getHistoricalArchiveUrl(categoryParam, dateStr!, langParam);
      const feed = await fetchFeed(url);
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
          source: extractSourceName(item, feed.title || '', source),
          snippet: processSnippet(rawSnippet),
          thumbnail: await extractImage(item, articleTitle, articleCat),
          category: articleCat,
          lang: 'en'
        };
      });
      
      const itemsSettled = await Promise.allSettled(itemPromises);
      allItems = itemsSettled.filter(p => p.status === 'fulfilled').map(p => (p as PromiseFulfilledResult<NewsItem>).value);
      
      counts.all = allItems.length;
      if (categoryParam !== 'all') {
        counts[categoryParam as keyof typeof counts] = allItems.length;
      }
    } else if (locationParam) {
      const query = encodeURIComponent(`${locationParam} uttar pradesh when:3d`);
      const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=hi&gl=IN&ceid=IN:hi`;
      
      const feed = await fetchFeed(feedUrl);
      
      const itemPromises = feed.items.map(async (item) => {
        let articleTitle = item.title ? decodeHTMLEntities(item.title) : 'No Title';
        let articleSource = extractSourceName(item, feed.title || '', 'Google News');
        
        const lastDashIndex = articleTitle.lastIndexOf(' - ');
        if (lastDashIndex !== -1) {
          articleSource = articleTitle.substring(lastDashIndex + 3).trim();
          articleTitle = articleTitle.substring(0, lastDashIndex).trim();
        }

        const rawSnippet = item.description || item.contentSnippet || item['content:encoded'] || '';
        const snippetText = processSnippet(rawSnippet);
        
        return extractImage(item, articleTitle, 'state-news').then(thumbnail => ({
          id: item.guid || item.link || String(Math.random()),
          title: articleTitle,
          link: item.link || '#',
          pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          source: articleSource.toUpperCase(),
          snippet: snippetText,
          thumbnail: thumbnail || null,
          category: 'state-news',
          stateName: locationParam.charAt(0).toUpperCase() + locationParam.slice(1),
          lang: 'hi'
        }));
      });
      
      const itemsSettled = await Promise.allSettled(itemPromises);
      allItems = itemsSettled.filter(p => p.status === 'fulfilled').map(p => (p as PromiseFulfilledResult<NewsItem>).value);
      
      counts.all = allItems.length;
      counts['state-news'] = allItems.length;
    } else {
      // Live Mode: Filter unified FEEDS array
      const targetFeeds = FEEDS.filter(f => {
        if (f.lang !== langParam) return false;
        
        if (categoryParam !== 'all') {
          if (categoryParam === 'state-news') {
             if (f.category !== 'state-news') return false;
             if (cityParam && f.city !== cityParam.toLowerCase()) return false;
             if (stateParam && !cityParam && f.state !== stateParam) return false;
          } else {
             if (f.category !== categoryParam) return false;
          }
        }
        return true;
      });

      const fetchPromises = targetFeeds.map(f => 
        fetchFeed(f.url).then(feed => ({ 
          feed, 
          source: f.name || new URL(f.url).hostname, 
          category: f.category, 
          lang: f.lang,
          stateName: f.state ? (STATE_NAMES[f.state] || f.state) : undefined,
          isCityFeed: !!f.city
        }))
      );

      const results = await Promise.allSettled(fetchPromises);
      let parsePromises: Promise<NewsItem>[] = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { feed, source, category, stateName, isCityFeed, lang } = result.value;
          
          feed.items.forEach((item: any) => {
            const rawSnippet = item.description || item.contentSnippet || item['content:encoded'] || '';
            const articleTitle = item.title ? decodeHTMLEntities(item.title) : 'No Title';
            const snippetText = processSnippet(rawSnippet);
            
            const isCA = category !== 'state-news' && isCurrentAffairs(articleTitle, snippetText);
            const finalCategory = isCA ? 'current-affairs' : category;
            
            parsePromises.push(
              extractImage(item, articleTitle, finalCategory).then(thumbnail => ({
                id: item.guid || item.link || String(Math.random()),
                title: articleTitle,
                link: item.link || '#',
                pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                source: isCityFeed ? source.toUpperCase() : extractSourceName(item, feed.title || '', source, stateName),
                snippet: snippetText,
                thumbnail,
                category: finalCategory,
                stateName,
                lang
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

      counts.all = allItems.length;
      counts.upsc = allItems.filter(i => i.category === 'upsc').length;
      counts['current-affairs'] = allItems.filter(i => i.category === 'current-affairs').length;
      counts.economy = allItems.filter(i => i.category === 'economy').length;
      counts.science = allItems.filter(i => i.category === 'science').length;
      counts.world = allItems.filter(i => i.category === 'world').length;
      counts['state-news'] = allItems.filter(i => i.category === 'state-news').length;


    }

  const responseData = { counts, lastUpdated, articles: allItems };
    globalCache[cacheKey] = { data: responseData, timestamp: Date.now() };

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to aggregate news' }, { status: 500 });
  }
}
