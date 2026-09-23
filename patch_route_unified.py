import re

with open('src/app/api/news/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = re.sub(
    r"import \{ LIVE_FEED_URLS, Category, getHistoricalArchiveUrl, STATE_FEEDS, STATE_NAMES, PIB_HINDI_FALLBACK, CITY_FEEDS \} from '@/config/feeds';",
    "import { FEEDS, Category, getHistoricalArchiveUrl, STATE_NAMES } from '@/config/feeds';",
    content
)

# 2. Add langParam
content = content.replace(
    "  const locationParam = searchParams.get('location');",
    "  const locationParam = searchParams.get('location');\n  const langParam = (searchParams.get('lang') as 'en' | 'hi') || 'en';"
)

# 3. Update Historical Mode
content = content.replace(
    "const url = getHistoricalArchiveUrl(categoryParam, dateStr!);",
    "const url = getHistoricalArchiveUrl(categoryParam, dateStr!, langParam);"
)

# 4. Update the entire Live Mode logic
old_live_mode = """      // Live Mode: Fetch ALL feeds for the 4 core categories
      const categoriesToFetch: (keyof typeof LIVE_FEED_URLS)[] = ['upsc', 'economy', 'science', 'world'];
      
      const fetchPromises: Promise<any>[] = categoriesToFetch.flatMap(cat => {
        const feeds = LIVE_FEED_URLS[cat as keyof typeof LIVE_FEED_URLS] || [];
        return feeds.map(feedObj => 
          fetchFeed(feedObj.url).then(feed => ({ feed, source: new URL(feedObj.url).hostname, category: cat, lang: feedObj.lang }))
        );
      });

      if (categoryParam === 'state-news') {
        if (cityParam && CITY_FEEDS[cityParam.toLowerCase()]) {
           CITY_FEEDS[cityParam.toLowerCase()].forEach(sourceObj => fetchPromises.push(
             fetchFeed(sourceObj.url).then(feed => ({ feed, source: sourceObj.name, category: 'state-news', stateName: 'Uttar Pradesh', isCityFeed: true, lang: sourceObj.lang }))
           ));
        } else if (stateParam && STATE_FEEDS[stateParam]) {
           STATE_FEEDS[stateParam].forEach(feedObj => fetchPromises.push(
             fetchFeed(feedObj.url).then(feed => ({ feed, source: new URL(feedObj.url).hostname, category: 'state-news', stateName: STATE_NAMES[stateParam] || stateParam, lang: feedObj.lang }))
           ));
        } else {
           Object.entries(STATE_FEEDS).forEach(([st, feeds]) => {
             feeds.forEach(feedObj => fetchPromises.push(
               fetchFeed(feedObj.url).then(feed => ({ feed, source: new URL(feedObj.url).hostname, category: 'state-news', stateName: STATE_NAMES[st] || st, lang: feedObj.lang }))
             ));
           });
        }
      }"""

new_live_mode = """      // Live Mode: Filter unified FEEDS array
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
      );"""

content = content.replace(old_live_mode, new_live_mode)

# 5. Remove the fallback logic since FEEDS handles it
fallback_regex = r"      // Filter if a specific category was requested\n      if \(categoryParam !== 'all'\) \{.*?\}\n      \}"
content = re.sub(fallback_regex, "", content, flags=re.DOTALL)

with open('src/app/api/news/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("route.ts unified patched successfully")
