import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const revalidate = 3600; // Cache response

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch article: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, iframe, nav, footer, header, aside, .ad, .ads, .advertisement, .social-share, .newsletter, .related-stories, .recommended, noscript').remove();

    let content = '';

    // Try finding the main article body
    const articleContainer = $('article, .story-content, .article-body, .post-content, .entry-content, main, #main-content').first();

    if (articleContainer.length > 0) {
      articleContainer.find('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) {
          content += `<p>${text}</p>\n`;
        }
      });
    } else {
      // Fallback: search for all p tags if no container found
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) {
          content += `<p>${text}</p>\n`;
        }
      });
    }

    // Check if we extracted at least some paragraphs
    const paragraphs = content.split('</p>');
    if (paragraphs.length < 3) {
      // Less than 2 paragraphs (length is n+1 since we split by </p>)
      content = ''; 
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Article extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract article' }, { status: 500 });
  }
}
