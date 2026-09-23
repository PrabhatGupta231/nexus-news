import re

with open('src/app/api/news/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add caching variables and fetchFeed helper
header_insert = """
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
"""
content = content.replace("const parser = new Parser({\n  customFields: {\n    item: ['media:content', 'media:thumbnail', 'enclosure', 'content:encoded', 'description', 'source'],\n  },\n});", header_insert)

# 2. Add Cache check at start of GET
get_insert = """export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cacheKey = searchParams.toString();
  const now = Date.now();

  if (globalCache[cacheKey] && now - globalCache[cacheKey].timestamp < CACHE_TTL) {
    return NextResponse.json(globalCache[cacheKey].data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  }

  const categoryParam = (searchParams.get('category') as Category | 'state-news') || 'all';"""
content = content.replace("export async function GET(request: Request) {\n  const { searchParams } = new URL(request.url);\n  const categoryParam = (searchParams.get('category') as Category | 'state-news') || 'all';", get_insert)

# 3. Replace parser.parseURL with fetchFeed
content = content.replace("parser.parseURL(", "fetchFeed(")

# 4. Update the return to set cache
return_repl = """  const responseData = { counts, lastUpdated, articles: allItems };
    globalCache[cacheKey] = { data: responseData, timestamp: Date.now() };

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });"""
content = content.replace("    return NextResponse.json({\n      counts,\n      lastUpdated,\n      articles: allItems\n    });", return_repl)

with open('src/app/api/news/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("route.ts patched successfully")
