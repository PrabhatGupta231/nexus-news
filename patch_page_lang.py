import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State for Lang
content = content.replace(
    "  const initialCity = searchParams.get('city') || '';",
    "  const initialCity = searchParams.get('city') || '';\n  const initialLang = searchParams.get('lang') || 'all';"
)
content = content.replace(
    "  const [selectedCity, setSelectedCity] = useState<string>(initialCity);",
    "  const [selectedCity, setSelectedCity] = useState<string>(initialCity);\n  const [selectedLang, setSelectedLang] = useState<string>(initialLang);"
)

# 2. Update displayedNews filter
old_filter = """  // Filter news by search query
  const displayedNews = showBookmarks 
    ? bookmarks 
    : news.filter(article => {
        if (!searchQuery) return true;"""
new_filter = """  // Filter news by search query and language
  const displayedNews = showBookmarks 
    ? bookmarks 
    : news.filter(article => {
        if (selectedLang !== 'all' && article.lang && article.lang !== selectedLang) return false;
        if (!searchQuery) return true;"""
content = content.replace(old_filter, new_filter)

# 3. Add Language Toggle Pill
font_resizer = """            {/* Font Resizer */}
            <div className="flex items-center gap-2 bg-black/50 rounded-sm p-0.5 border border-gray-700">
              <button onClick={() => setFontSize('text-sm')} className={`px-2 py-1 font-serif transition-colors ${fontSize === 'text-sm' ? 'text-[var(--color-nexus-red)]' : 'text-gray-400 hover:text-white'}`}>A-</button>
              <button onClick={() => setFontSize('text-base')} className={`px-2 py-1 font-serif transition-colors ${fontSize === 'text-base' ? 'text-[var(--color-nexus-red)]' : 'text-gray-400 hover:text-white'}`}>A</button>
              <button onClick={() => setFontSize('text-lg')} className={`px-2 py-1 font-serif transition-colors ${fontSize === 'text-lg' ? 'text-[var(--color-nexus-red)]' : 'text-gray-400 hover:text-white'}`}>A+</button>
            </div>"""

lang_pill = """            {/* Font Resizer */}
            <div className="flex items-center gap-2 bg-black/50 rounded-sm p-0.5 border border-gray-700">
              <button onClick={() => setFontSize('text-sm')} className={`px-2 py-1 font-serif transition-colors ${fontSize === 'text-sm' ? 'text-[var(--color-nexus-red)]' : 'text-gray-400 hover:text-white'}`}>A-</button>
              <button onClick={() => setFontSize('text-base')} className={`px-2 py-1 font-serif transition-colors ${fontSize === 'text-base' ? 'text-[var(--color-nexus-red)]' : 'text-gray-400 hover:text-white'}`}>A</button>
              <button onClick={() => setFontSize('text-lg')} className={`px-2 py-1 font-serif transition-colors ${fontSize === 'text-lg' ? 'text-[var(--color-nexus-red)]' : 'text-gray-400 hover:text-white'}`}>A+</button>
            </div>
            
            {/* Language Toggle */}
            <div className="hidden md:flex items-center gap-1 bg-black/50 rounded-sm p-0.5 border border-gray-700">
              {['all', 'en', 'hi'].map(l => (
                <button
                  key={l}
                  onClick={() => { setSelectedLang(l); updateUrl({ lang: l === 'all' ? null : l, article: null }); }}
                  className={`px-3 py-1 font-sans text-[10px] font-black uppercase tracking-widest transition-colors rounded-sm ${selectedLang === l ? 'bg-[var(--color-nexus-red)] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {l === 'en' ? 'EN' : l === 'hi' ? 'HI' : 'ALL'}
                </button>
              ))}
            </div>"""

content = content.replace(font_resizer, lang_pill)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("page.tsx updated for lang filtering")
