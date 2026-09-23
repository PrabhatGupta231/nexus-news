import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace setNews to also update localStorage cache
content = content.replace(
    "setNews(data.articles || []);",
    """setNews(data.articles || []);
      // Cache the latest news for instant load
      if (!isBackgroundSync && data.articles && data.articles.length > 0) {
        sessionStorage.setItem(`nexus_news_cache_${category}_${state}_${city}`, JSON.stringify(data.articles));
      }"""
)

# On mount/effect, load from cache before fetching
effect_replace = """    if (isClient) {
      // Try loading from session cache instantly
      const cached = sessionStorage.getItem(`nexus_news_cache_${activeCategory}_${selectedState}_${selectedCity}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setNews(parsed);
            setLoading(false); // We have content, no need to show skeleton
          }
        } catch (e) {}
      }

      fetchNews(activeCategory, selectedDate, selectedState, selectedCity, !!cached);"""

content = content.replace(
    "    if (isClient) {\n      fetchNews(activeCategory, selectedDate, selectedState, selectedCity);",
    effect_replace
)

# Replace loader with Skeleton
loader_replace = """        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 pb-16">
            <div className="lg:col-span-8 group animate-pulse">
               <div className="w-full h-[380px] bg-gray-200 mb-4 rounded-sm"></div>
               <div className="h-4 bg-gray-200 w-1/4 mb-4"></div>
               <div className="h-10 bg-gray-200 w-full mb-4"></div>
               <div className="h-4 bg-gray-200 w-full mb-2"></div>
               <div className="h-4 bg-gray-200 w-5/6"></div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-6 animate-pulse">
               <div className="h-6 bg-gray-200 w-1/3 mb-2"></div>
               {[1,2,3].map(i => (
                 <div key={i} className="flex gap-4 mb-4 border-b border-gray-100 pb-4">
                   <div className="flex-grow">
                     <div className="h-3 bg-gray-200 w-1/4 mb-2"></div>
                     <div className="h-4 bg-gray-200 w-full mb-2"></div>
                     <div className="h-4 bg-gray-200 w-2/3"></div>
                   </div>
                   <div className="w-24 h-24 bg-gray-200 flex-shrink-0 ml-4 rounded-sm"></div>
                 </div>
               ))}
            </div>
          </div>
        ) :"""
content = content.replace(
    """        {loading ? (
          <div className="flex justify-center items-center py-32 flex-col gap-6">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-nexus-red)]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Curating the Edition...</span>
          </div>
        ) :""",
    loader_replace
)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("page.tsx patched successfully for performance")
