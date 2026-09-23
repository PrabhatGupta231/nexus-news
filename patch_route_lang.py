import re

with open('src/app/api/news/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update NewsItem interface
content = content.replace(
    "  stateName?: string;",
    "  stateName?: string;\n  lang?: 'en' | 'hi';"
)

# 2. Update LIVE_FEED_URLS mapping
content = content.replace(
    """        const urls = LIVE_FEED_URLS[cat];
        return urls.map(url => 
          fetchFeed(url).then(feed => ({ feed, source: new URL(url).hostname, category: cat }))
        );""",
    """        const feeds = LIVE_FEED_URLS[cat as keyof typeof LIVE_FEED_URLS] || [];
        return feeds.map(feedObj => 
          fetchFeed(feedObj.url).then(feed => ({ feed, source: new URL(feedObj.url).hostname, category: cat, lang: feedObj.lang }))
        );"""
)

# 3. Update STATE_FEEDS and CITY_FEEDS mapping
content = content.replace(
    """           CITY_FEEDS[cityParam.toLowerCase()].forEach(sourceObj => fetchPromises.push(
             fetchFeed(sourceObj.url).then(feed => ({ feed, source: sourceObj.name, category: 'state-news', stateName: 'Uttar Pradesh', isCityFeed: true }))
           ));""",
    """           CITY_FEEDS[cityParam.toLowerCase()].forEach(sourceObj => fetchPromises.push(
             fetchFeed(sourceObj.url).then(feed => ({ feed, source: sourceObj.name, category: 'state-news', stateName: 'Uttar Pradesh', isCityFeed: true, lang: sourceObj.lang }))
           ));"""
)
content = content.replace(
    """           STATE_FEEDS[stateParam].forEach(url => fetchPromises.push(
             fetchFeed(url).then(feed => ({ feed, source: new URL(url).hostname, category: 'state-news', stateName: STATE_NAMES[stateParam] || stateParam }))
           ));""",
    """           STATE_FEEDS[stateParam].forEach(feedObj => fetchPromises.push(
             fetchFeed(feedObj.url).then(feed => ({ feed, source: new URL(feedObj.url).hostname, category: 'state-news', stateName: STATE_NAMES[stateParam] || stateParam, lang: feedObj.lang }))
           ));"""
)
content = content.replace(
    """           Object.entries(STATE_FEEDS).forEach(([st, urls]) => {
             urls.forEach(url => fetchPromises.push(
               fetchFeed(url).then(feed => ({ feed, source: new URL(url).hostname, category: 'state-news', stateName: STATE_NAMES[st] || st }))
             ));
           });""",
    """           Object.entries(STATE_FEEDS).forEach(([st, feeds]) => {
             feeds.forEach(feedObj => fetchPromises.push(
               fetchFeed(feedObj.url).then(feed => ({ feed, source: new URL(feedObj.url).hostname, category: 'state-news', stateName: STATE_NAMES[st] || st, lang: feedObj.lang }))
             ));
           });"""
)

# 4. Update the fallback logic
content = content.replace(
    """                const fallbackPromises = PIB_HINDI_FALLBACK.map(url => 
                   fetchFeed(url).then(feed => ({ feed, source: 'PIB Regional' }))
                );""",
    """                const fallbackPromises = PIB_HINDI_FALLBACK.map(feedObj => 
                   fetchFeed(feedObj.url).then(feed => ({ feed, source: 'PIB Regional', lang: feedObj.lang }))
                );"""
)

content = content.replace(
    """                            category: 'state-news',
                            stateName: STATE_NAMES[stateParam] || stateParam""",
    """                            category: 'state-news',
                            stateName: STATE_NAMES[stateParam] || stateParam,
                            lang: (res.value as any).lang || 'hi'"""
)

# 5. Add lang to parsePromises output in live mode
content = content.replace(
    """          const { feed, source, category, stateName, isCityFeed } = result.value;""",
    """          const { feed, source, category, stateName, isCityFeed, lang } = result.value;"""
)
content = content.replace(
    """                category: finalCategory,
                stateName
              }))""",
    """                category: finalCategory,
                stateName,
                lang
              }))"""
)

# 6. Add lang to Historical Archive Mode mapping
content = content.replace(
    """          category: articleCat,
        };""",
    """          category: articleCat,
          lang: 'en'
        };"""
)

# 7. Add lang to Google News search fallback
content = content.replace(
    """          category: 'state-news',
          stateName: locationParam.charAt(0).toUpperCase() + locationParam.slice(1)
        }));""",
    """          category: 'state-news',
          stateName: locationParam.charAt(0).toUpperCase() + locationParam.slice(1),
          lang: 'hi'
        }));"""
)

with open('src/app/api/news/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("route.ts updated for lang")
