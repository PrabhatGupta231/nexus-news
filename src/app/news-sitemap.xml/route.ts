import { NextResponse } from 'next/server';
import { LIVE_FEED_URLS, Category } from '@/config/feeds';
import Parser from 'rss-parser';

export const revalidate = 600; // 10 minutes cache

const parser = new Parser();

export async function GET() {
  try {
    // Fetch top articles (we can just fetch from 'all' feeds to get latest)
    const categoriesToFetch: (keyof typeof LIVE_FEED_URLS)[] = ['upsc', 'economy', 'science', 'world'];
    
    const fetchPromises = categoriesToFetch.flatMap(cat => {
      const urls = LIVE_FEED_URLS[cat];
      return urls.map(url => parser.parseURL(url));
    });

    const results = await Promise.allSettled(fetchPromises);
    
    let allItems: any[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allItems = allItems.concat(result.value.items);
      }
    });

    // Deduplicate and sort by date
    const uniqueItems = new Map();
    allItems.forEach(item => {
      const id = item.guid || item.link;
      if (id && !uniqueItems.has(id)) {
        uniqueItems.set(id, item);
      }
    });
    
    const sortedItems = Array.from(uniqueItems.values())
      .sort((a, b) => new Date(b.pubDate || new Date()).getTime() - new Date(a.pubDate || new Date()).getTime())
      .slice(0, 50);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${sortedItems.map(article => {
    const pubDate = new Date(article.pubDate || new Date()).toISOString();
    return `
    <url>
      <loc><![CDATA[${article.link}]]></loc>
      <news:news>
        <news:publication>
          <news:name><![CDATA[NEXUS NEWS]]></news:name>
          <news:language>en</news:language>
        </news:publication>
        <news:publication_date>${pubDate}</news:publication_date>
        <news:title><![CDATA[${article.title}]]></news:title>
      </news:news>
    </url>`;
  }).join('')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=600, stale-while-revalidate',
      },
    });
  } catch (e) {
    console.error('Failed to generate sitemap', e);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
