import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Chunk 1: Imports and initial setup
content = re.sub(
    r"import \{ useState, useEffect, useRef \} from 'react';(.*?)export default function Home\(\) \{\n  const todayStr = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];\n\n  const \[activeCategory, setActiveCategory\] = useState<Category \| 'state-news'>\('all'\);\n  const \[selectedDate, setSelectedDate\] = useState<string>\(todayStr\);\n  const \[selectedState, setSelectedState\] = useState<string>\(''\);\n  const \[selectedCity, setSelectedCity\] = useState<string>\(''\);",
    r"import { useState, useEffect, useRef, Suspense } from 'react';\1import { useSearchParams, useRouter, usePathname } from 'next/navigation';\n\nfunction HomeContent() {\n  const searchParams = useSearchParams();\n  const router = useRouter();\n  const pathname = usePathname();\n\n  const todayStr = new Date().toISOString().split('T')[0];\n\n  const initialTab = (searchParams.get('tab') as Category | 'state-news') || 'all';\n  const initialState = searchParams.get('state') || '';\n  const initialCity = searchParams.get('city') || '';\n  const articleId = searchParams.get('article') || null;\n\n  const [activeCategory, setActiveCategory] = useState<Category | 'state-news'>(initialTab);\n  const [selectedDate, setSelectedDate] = useState<string>(todayStr);\n  const [selectedState, setSelectedState] = useState<string>(initialState);\n  const [selectedCity, setSelectedCity] = useState<string>(initialCity);",
    content,
    flags=re.DOTALL
)

# Chunk 2: Functions right before the first useEffect
insertion = """  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCategoryChange = (cat: Category | 'state-news') => {
    setActiveCategory(cat);
    setSelectedCity('');
    setShowBookmarks(false);
    updateUrl({ tab: cat, city: null, state: cat === 'state-news' ? selectedState : null, article: null });
  };

  const handleStateChange = (state: string) => {
    setActiveCategory('state-news');
    setSelectedState(state);
    setSelectedCity('');
    setShowBookmarks(false);
    updateUrl({ tab: 'state-news', state: state || null, city: null, article: null });
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSearchQuery('');
    updateUrl({ city: city || null, article: null });
  };

  const handleSelectArticle = (article: NewsItem | null) => {
    setSelectedArticle(article);
    updateUrl({ article: article ? article.id : null });
  };

  useEffect(() => {
    if (articleId && !selectedArticle) {
      const found = news.find(a => a.id === articleId) || bookmarks.find(a => a.id === articleId);
      if (found) setSelectedArticle(found);
    } else if (!articleId && selectedArticle) {
      setSelectedArticle(null);
    }
  }, [articleId, news, bookmarks, selectedArticle]);
"""
content = content.replace("  const mobileDropdownRef = useRef<HTMLDivElement>(null);", insertion)

# Chunk 3: Replace setCategory scattered handlers
content = content.replace(
    "onClick={() => { setActiveCategory(cat.id as Category); setSelectedCity(''); setMobileDropdownOpen(false); setShowBookmarks(false); }}",
    "onClick={() => { handleCategoryChange(cat.id as Category); setMobileDropdownOpen(false); }}"
)
content = content.replace(
    "onClick={() => { setActiveCategory('state-news'); setSelectedState(st === 'All States' ? '' : st); setSelectedCity(''); setMobileDropdownOpen(false); setShowBookmarks(false); }}",
    "onClick={() => { handleStateChange(st === 'All States' ? '' : st); setMobileDropdownOpen(false); }}"
)
content = content.replace(
    "onClick={() => { setActiveCategory(cat.id as Category); setSelectedCity(''); setShowBookmarks(false); }}",
    "onClick={() => handleCategoryChange(cat.id as Category)}"
)
content = content.replace(
    "onClick={() => { setActiveCategory(cat.id as Category); setSelectedCity(''); setMoreDropdownOpen(false); setShowBookmarks(false); }}",
    "onClick={() => { handleCategoryChange(cat.id as Category); setMoreDropdownOpen(false); }}"
)
content = content.replace(
    "onClick={() => { setActiveCategory('state-news'); setSelectedState(st === 'All States' ? '' : st); setSelectedCity(''); setMoreDropdownOpen(false); setShowBookmarks(false); }}",
    "onClick={() => { handleStateChange(st === 'All States' ? '' : st); setMoreDropdownOpen(false); }}"
)

# Chunk 4: Replace setSelectedCity handlers
content = content.replace(
    "onClick={() => { setSelectedCity(''); setSearchQuery(''); }}",
    "onClick={() => handleCityChange('')}"
)
content = content.replace(
    "onClick={() => { setSelectedCity(city.toLowerCase()); setSearchQuery(''); }}",
    "onClick={() => handleCityChange(city.toLowerCase())}"
)

# Chunk 5: Replace setSelectedArticle handlers
content = content.replace(
    "onClick={() => setSelectedArticle(leadArticle)}",
    "onClick={() => handleSelectArticle(leadArticle)}"
)
content = content.replace(
    "onClick={() => setSelectedArticle(article)}",
    "onClick={() => handleSelectArticle(article)}"
)
content = content.replace(
    "onClose={() => setSelectedArticle(null)}",
    "onClose={() => handleSelectArticle(null)}"
)

# Chunk 6: Wrap export
content += """

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex justify-center items-center bg-[var(--color-nexus-bg)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-nexus-red)]" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
"""

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully")
