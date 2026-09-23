'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { NEWS_CATEGORIES, Category } from '@/config/feeds';
import { NewsItem } from '@/app/api/news/route';
import { Search, Loader2, Mail, ExternalLink, Calendar, RefreshCw, Clock, Bookmark, X, Volume2, Share2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import NewsCard from '@/components/NewsCard';
import BreakingTicker from '@/components/BreakingTicker';
import ArticleModal from '@/components/ArticleModal';

type FontSize = 'text-sm' | 'text-base' | 'text-lg';

interface CategoryCounts {
  [key: string]: number | undefined;
  all: number;
  upsc: number;
  'current-affairs': number;
  economy: number;
  science: number;
  world?: number;
  'state-news'?: number;
}

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const todayStr = new Date().toISOString().split('T')[0];

  const initialTab = (searchParams.get('tab') as Category | 'state-news') || 'all';
  const initialState = searchParams.get('state') || '';
  const initialCity = searchParams.get('city') || '';
  const initialLang = searchParams.get('lang') || 'en';
  const articleId = searchParams.get('article') || null;

  const [activeCategory, setActiveCategory] = useState<Category | 'state-news'>(initialTab);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [selectedLang, setSelectedLang] = useState<string>(initialLang);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [tabCounts, setTabCounts] = useState<CategoryCounts>({ all: 0, upsc: 0, 'current-affairs': 0, economy: 0, science: 0, world: 0, 'state-news': 0 });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // New Features State
  const [fontSize, setFontSize] = useState<FontSize>('text-base');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<NewsItem[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

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

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    updateUrl({ lang, article: null });
  };

  useEffect(() => {
    if (articleId && !selectedArticle) {
      const found = news.find(a => a.id === articleId) || bookmarks.find(a => a.id === articleId);
      if (found) setSelectedArticle(found);
    } else if (!articleId && selectedArticle) {
      setSelectedArticle(null);
    }
  }, [articleId, news, bookmarks, selectedArticle]);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setMobileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isPastDate = selectedDate !== todayStr;

  useEffect(() => {
    setIsClient(true);
    const savedBookmarks = localStorage.getItem('nexus_bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error('Error parsing bookmarks', e);
      }
    }
  }, []);

  const handleBookmarkToggle = (article: NewsItem) => {
    setBookmarks(prev => {
      const isBookmarked = prev.some(b => b.id === article.id);
      let updated: NewsItem[];
      if (isBookmarked) {
        updated = prev.filter(b => b.id !== article.id);
      } else {
        updated = [...prev, article];
      }
      localStorage.setItem('nexus_bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  const fetchNews = async (category: Category | 'state-news', dateStr: string, state: string = '', city: string = '', lang: string = 'en', isBackgroundSync = false) => {
    if (!isBackgroundSync) setLoading(true);
    setError(null);
    try {
      let url = `/api/news?category=${category}&date=${dateStr}&lang=${lang}`;
      if (state) url += `&state=${state}`;
      if (city) url += `&location=${city}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      setNews(data.articles || []);
      // Cache the latest news for instant load
      if (!isBackgroundSync && data.articles && data.articles.length > 0) {
        sessionStorage.setItem(`nexus_news_cache_${category}_${state}_${city}`, JSON.stringify(data.articles));
      }
      if (data.counts) {
        setTabCounts(prev => ({ ...prev, ...data.counts }));
      }
      if (data.lastUpdated) {
        setLastUpdated(data.lastUpdated);
      } else if (isBackgroundSync) {
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      if (!isBackgroundSync) setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (!isBackgroundSync) setLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) {
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

      fetchNews(activeCategory, selectedDate, selectedState, selectedCity, selectedLang, !!cached);
      
      // Background polling every 10 minutes (600,000ms) ONLY if it's today's live feed
      if (!isPastDate) {
        const intervalId = setInterval(() => {
          fetchNews(activeCategory, selectedDate, selectedState, selectedCity, selectedLang, true);
        }, 600000);
        return () => clearInterval(intervalId);
      }
    }
  }, [activeCategory, selectedDate, selectedState, selectedCity, selectedLang, isPastDate, isClient]);

  if (!isClient) return null; // Prevent hydration mismatch

  // Filter news by search query and language
  const displayedNews = showBookmarks 
    ? bookmarks 
    : news.filter(article => {
        
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return article.title.toLowerCase().includes(q) || article.snippet.toLowerCase().includes(q) || article.category.toLowerCase().includes(q);
      });

  const leadArticleIndex = displayedNews.findIndex(a => a.thumbnail);
  const leadArticle = leadArticleIndex !== -1 ? displayedNews[leadArticleIndex] : displayedNews[0];
  
  const remainingNews = displayedNews.filter(a => a.id !== (leadArticle?.id || ''));
  const heroSidebarArticles = remainingNews.slice(0, 3);
  const feedGridArticles = remainingNews.slice(3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": displayedNews.slice(0, 10).map((art, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "NewsArticle",
        "headline": art.title,
        "image": [art.thumbnail || ""],
        "datePublished": art.pubDate,
        "dateModified": art.pubDate,
        "author": {
          "@type": "Organization",
          "name": art.source
        },
        "publisher": {
          "@type": "Organization",
          "name": "NEXUS NEWS",
          "logo": {
            "@type": "ImageObject",
            "url": "https://your-domain.vercel.app/logo.png"
          }
        },
        "description": art.snippet,
        "mainEntityOfPage": art.link
      }
    }))
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[var(--color-nexus-bg)] ${fontSize}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* 1. Top Live Ticker & Utility Header */}
      <div className="bg-[var(--color-nexus-dark)] text-white text-xs border-b border-gray-800 relative z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-2 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Marquee / Ticker */}
          <BreakingTicker articles={news.slice(0, 10)} />

          {/* Controls */}
          <div className="flex items-center gap-6">
            {!isPastDate && lastUpdated && (
              <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-green-400 uppercase tracking-widest">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                Live Syncing (Last synced {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })})
              </div>
            )}

            {/* Font Resizer */}
            <div className="flex items-center gap-2 bg-black/50 rounded-sm p-0.5 border border-gray-700">
              <button onClick={() => setFontSize('text-sm')} className={`px-2 py-1 font-serif transition-colors ${fontSize === 'text-sm' ? 'text-[var(--color-nexus-red)]' : 'text-gray-400 hover:text-white'}`}>A-</button>
              <button onClick={() => setFontSize('text-base')} className={`px-2 py-1 font-serif transition-colors ${fontSize === 'text-base' ? 'text-[var(--color-nexus-red)]' : 'text-gray-400 hover:text-white'}`}>A</button>
              <button onClick={() => setFontSize('text-lg')} className={`px-2 py-1 font-serif transition-colors ${fontSize === 'text-lg' ? 'text-[var(--color-nexus-red)]' : 'text-gray-400 hover:text-white'}`}>A+</button>
            </div>
            
            {/* Language Toggle */}
            <div className="flex items-center bg-stone-900 border border-stone-700 rounded-md p-0.5 text-xs mr-3">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  selectedLang === 'en'
                    ? 'bg-[#D32F2F] text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                ENGLISH
              </button>
              <button
                onClick={() => handleLanguageChange('hi')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  selectedLang === 'hi'
                    ? 'bg-[#D32F2F] text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>
            
            {/* Saved Dispatches */}
            <button 
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={`flex items-center gap-1.5 font-bold uppercase tracking-widest text-[10px] transition-colors ${showBookmarks ? 'text-[var(--color-nexus-red)]' : 'text-gray-400 hover:text-white'}`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={showBookmarks ? 'currentColor' : 'none'} /> 
              Saved ({bookmarks.length})
            </button>

            {/* Date Picker */}
            <div className="flex items-center gap-2">
               <Calendar className="w-3.5 h-3.5 text-gray-400" />
               <input 
                 type="date"
                 max={todayStr}
                 value={selectedDate}
                 onChange={(e) => { setSelectedDate(e.target.value); setShowBookmarks(false); }}
                 className="bg-transparent text-gray-300 focus:outline-none focus:text-white font-sans text-xs cursor-pointer"
               />
               {isPastDate && (
                 <button 
                   onClick={() => setSelectedDate(todayStr)}
                   className="text-[var(--color-nexus-red)] hover:text-white transition-colors ml-1"
                   title="Reset to Today"
                 >
                   <RefreshCw className="w-3.5 h-3.5" />
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Masthead Header */}
      <header className="w-full py-12 flex flex-col items-center justify-center border-b border-[var(--color-nexus-border)] bg-[var(--color-nexus-bg)]">
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter font-serif text-[var(--color-nexus-dark)] cursor-pointer" onClick={() => setShowBookmarks(false)}>
          NEXUS<span className="text-[var(--color-nexus-red)] ml-3">NEWS</span>
        </h1>
        <div className="flex items-center gap-4 mt-4">
          <div className="w-12 h-[1px] bg-gray-300"></div>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">
            The Premier Academic & Aspirant Daily
          </p>
          <div className="w-12 h-[1px] bg-gray-300"></div>
        </div>
      </header>

      {/* 3. Sticky Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[var(--color-nexus-border)] shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 flex justify-between items-center">
          {/* Mobile Navigation */}
          <div className="block md:hidden w-full py-3" ref={mobileDropdownRef}>
            <button 
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-xs font-black uppercase tracking-widest flex justify-between items-center"
            >
              <span>
                {activeCategory === 'state-news' 
                  ? (selectedState ? (selectedState === 'uttar-pradesh' ? 'Uttar Pradesh (UP)' : selectedState === 'bihar' ? 'Bihar' : selectedState === 'madhya-pradesh' ? 'Madhya Pradesh' : 'Delhi NCR') : 'STATE DISPATCHES')
                  : NEWS_CATEGORIES.find(c => c.id === activeCategory)?.label || 'CATEGORIES'}
              </span>
              <span className="text-[10px] text-gray-500">{mobileDropdownOpen ? '▲' : '▼'}</span>
            </button>
            
            {mobileDropdownOpen && (
              <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl z-50 max-h-[60vh] overflow-y-auto">
                {NEWS_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { handleCategoryChange(cat.id as Category); setMobileDropdownOpen(false); }}
                    className={`block w-full text-left px-6 py-4 text-xs font-bold uppercase tracking-widest border-b border-gray-100 last:border-0 ${activeCategory === cat.id ? 'text-[var(--color-nexus-red)] bg-red-50/50' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat.label}
                  </button>
                ))}
                
                {/* State Dispatches in Mobile */}
                <div className="bg-gray-50 border-b border-gray-100">
                  <div className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">STATE DISPATCHES / राज्य</div>
                  {['All States', 'uttar-pradesh', 'bihar', 'madhya-pradesh', 'delhi-ncr'].map(st => {
                     const stLabel = st === 'All States' ? 'All States' : st === 'uttar-pradesh' ? 'Uttar Pradesh (UP)' : st === 'bihar' ? 'Bihar' : st === 'madhya-pradesh' ? 'Madhya Pradesh' : 'Delhi NCR';
                     const isActive = activeCategory === 'state-news' && selectedState === (st === 'All States' ? '' : st);
                     return (
                       <button
                         key={st}
                         onClick={() => { handleStateChange(st === 'All States' ? '' : st); setMobileDropdownOpen(false); }}
                         className={`block w-full text-left pl-8 pr-6 py-3 text-xs font-bold uppercase tracking-widest border-b border-gray-100 last:border-0 ${isActive ? 'text-[var(--color-nexus-red)] bg-red-50/50' : 'text-gray-600 hover:bg-gray-50'}`}
                       >
                         {stLabel}
                       </button>
                     );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">
            {/* Primary Tabs */}
            {NEWS_CATEGORIES.filter(cat => ['all', 'current-affairs', 'upsc'].includes(cat.id)).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id as Category)}
                className={`whitespace-nowrap px-6 py-4 text-xs font-black uppercase tracking-widest transition-colors relative flex items-center gap-2 ${
                  activeCategory === cat.id && !showBookmarks
                    ? 'text-[var(--color-nexus-red)]'
                    : 'text-gray-600 hover:text-[var(--color-nexus-dark)]'
                }`}
              >
                {cat.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${activeCategory === cat.id && !showBookmarks ? 'bg-[var(--color-nexus-red)]/10 text-[var(--color-nexus-red)]' : 'bg-gray-100 text-gray-400'}`}>
                  {(tabCounts as Record<string, number>)[cat.id] || 0}
                </span>
                {activeCategory === cat.id && !showBookmarks && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--color-nexus-red)]"></div>
                )}
              </button>
            ))}
            
            {/* More Desks Dropdown */}
            <div className="relative group" ref={dropdownRef}>
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`whitespace-nowrap px-6 py-4 text-xs font-black uppercase tracking-widest transition-colors relative flex items-center gap-2 ${
                  (!['all', 'current-affairs', 'upsc'].includes(activeCategory) || showBookmarks)
                    ? 'text-[var(--color-nexus-red)]'
                    : 'text-gray-600 hover:text-[var(--color-nexus-dark)]'
                }`}
              >
                MORE DESKS <span className="text-[10px] text-gray-500 ml-1">▼</span>
                {(!['all', 'current-affairs', 'upsc'].includes(activeCategory) || showBookmarks) && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--color-nexus-red)]"></div>
                )}
              </button>
              
              {moreDropdownOpen && (
                <div className="absolute top-full left-0 bg-white border border-[var(--color-nexus-border)] shadow-xl min-w-[240px] z-50 rounded-sm">
                  {NEWS_CATEGORIES.filter(cat => !['all', 'current-affairs', 'upsc'].includes(cat.id)).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { handleCategoryChange(cat.id as Category); setMoreDropdownOpen(false); }}
                      className={`block w-full text-left px-6 py-4 text-xs font-bold uppercase tracking-widest border-b border-gray-100 flex items-center justify-between ${activeCategory === cat.id && !showBookmarks ? 'text-[var(--color-nexus-red)] bg-red-50/50' : 'text-gray-600 hover:bg-gray-50 hover:text-[var(--color-nexus-red)]'}`}
                    >
                      {cat.label}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${activeCategory === cat.id && !showBookmarks ? 'bg-[var(--color-nexus-red)]/10 text-[var(--color-nexus-red)]' : 'bg-gray-100 text-gray-400'}`}>
                        {(tabCounts as Record<string, number>)[cat.id] || 0}
                      </span>
                    </button>
                  ))}
                  
                  {/* State Dispatches Sub-menu style */}
                  <div className="bg-gray-50">
                    <div className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center justify-between border-b border-gray-100">
                      STATE DISPATCHES / राज्य
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${activeCategory === 'state-news' && !showBookmarks ? 'bg-[var(--color-nexus-red)]/10 text-[var(--color-nexus-red)]' : 'bg-gray-100 text-gray-400'}`}>
                        {(tabCounts as Record<string, number>)['state-news'] || 0}
                      </span>
                    </div>
                    {['All States', 'uttar-pradesh', 'bihar', 'madhya-pradesh', 'delhi-ncr'].map(st => {
                       const stLabel = st === 'All States' ? 'All States' : st === 'uttar-pradesh' ? 'Uttar Pradesh (UP)' : st === 'bihar' ? 'Bihar' : st === 'madhya-pradesh' ? 'Madhya Pradesh' : 'Delhi NCR';
                       const isActive = activeCategory === 'state-news' && selectedState === (st === 'All States' ? '' : st) && !showBookmarks;
                       return (
                         <button
                           key={st}
                           onClick={() => { handleStateChange(st === 'All States' ? '' : st); setMoreDropdownOpen(false); }}
                           className={`block w-full text-left pl-8 pr-6 py-3 text-xs font-bold uppercase tracking-widest border-b border-gray-100 last:border-0 ${isActive ? 'text-[var(--color-nexus-red)] bg-red-50/50' : 'text-gray-600 hover:bg-white hover:text-[var(--color-nexus-red)]'}`}
                         >
                           {stLabel}
                         </button>
                       );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>
          
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[var(--color-nexus-border)] py-4 relative">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search dispatches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-bold font-sans text-gray-700 w-48 placeholder-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-[var(--color-nexus-red)]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {activeCategory === 'state-news' && selectedState === 'uttar-pradesh' && (
        <div className="bg-gray-50 border-b border-[var(--color-nexus-border)] py-2 px-4 flex items-center justify-center gap-4 text-xs font-bold z-30 relative flex-wrap">
          <span className="text-gray-400 uppercase tracking-widest">Cities:</span>
          <button 
            onClick={() => handleCityChange('')} 
            className={`transition-colors uppercase tracking-widest px-3 py-1 rounded-sm ${selectedCity === '' ? 'bg-[var(--color-nexus-red)] text-white' : 'text-gray-600 hover:text-[var(--color-nexus-red)] hover:bg-gray-200'}`}
          >
            All UP
          </button>
          {['Lucknow', 'Varanasi', 'Prayagraj', 'Kanpur'].map(city => (
            <button 
              key={city} 
              onClick={() => handleCityChange(city.toLowerCase())} 
              className={`transition-colors uppercase tracking-widest px-3 py-1 rounded-sm ${selectedCity === city.toLowerCase() ? 'bg-stone-900 text-[var(--color-nexus-red)]' : 'text-gray-600 hover:text-[var(--color-nexus-red)] hover:bg-gray-200'}`}
            >
              {city}
            </button>
          ))}
        </div>
      )}

      <main className="flex-grow max-w-[1400px] mx-auto px-4 py-12 w-full">
        {loading ? (
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
        ) : error ? (
          <div className="text-center py-20 bg-white border border-[var(--color-nexus-border)] p-12 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 font-serif">Failed to fetch the edition</h2>
            <p className="mb-8 text-gray-500 font-sans">{error}</p>
            <button
              onClick={() => fetchNews(activeCategory, selectedDate, selectedState, selectedCity, selectedLang)}
              className="bg-[var(--color-nexus-dark)] text-white px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-[var(--color-nexus-red)] transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : displayedNews.length === 0 ? (
          <div className="text-center py-32 border-y border-[var(--color-nexus-border)]">
            <h2 className="text-3xl font-bold text-gray-300 font-serif">
              {showBookmarks ? 'No Saved Dispatches' : 'Archive Empty'}
            </h2>
            <p className="text-gray-400 mt-2">
              {showBookmarks ? 'Bookmark stories to read them later offline.' : 'No dispatches found matching this criteria.'}
            </p>
          </div>
        ) : (
          <>
            {/* 4. Hero Editorial Section */}
            {leadArticle && (
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 pb-16 border-b border-[var(--color-nexus-border)]">
                {/* Primary Lead Story (8 cols) */}
                <div className="lg:col-span-8 group">
                  <div className="block">
                    {leadArticle.thumbnail ? (
                      <div className="relative aspect-[16/9] w-full max-h-[380px] overflow-hidden bg-gray-100 mb-4 rounded-sm">
                        <Image
                          src={leadArticle.thumbnail}
                          alt={leadArticle.title}
                          fill
                          className="object-cover transition-transform duration-1000 ease-out"
                        />
                        
                        {/* Top Right Controls on Hero */}
                        <div className="absolute top-4 right-4 z-20 flex gap-2">
                          <button 
                            onClick={() => {
                              if (!('speechSynthesis' in window)) return;
                              window.speechSynthesis.cancel();
                              const u = new SpeechSynthesisUtterance(`${leadArticle.title}. ${leadArticle.snippet}`);
                              window.speechSynthesis.speak(u);
                            }}
                            className="bg-white/90 p-2 rounded-full shadow-sm text-gray-600 hover:text-[var(--color-nexus-red)] transition-colors"
                            title="Read Aloud"
                          >
                            <Volume2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleBookmarkToggle(leadArticle)}
                            className={`bg-white/90 p-2 rounded-full shadow-sm transition-colors ${bookmarks.some(b => b.id === leadArticle.id) ? 'text-[var(--color-nexus-red)]' : 'text-gray-600 hover:text-[var(--color-nexus-red)]'}`}
                            title="Bookmark"
                          >
                            <Bookmark className="w-5 h-5" fill={bookmarks.some(b => b.id === leadArticle.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full bg-[var(--color-nexus-dark)] text-white p-8 md:p-12 mb-6 border-l-[8px] border-[var(--color-nexus-red)] relative rounded-sm shadow-md">
                        <div className="absolute top-4 right-4 z-20 flex gap-2">
                          <button 
                            onClick={() => {
                              if (!('speechSynthesis' in window)) return;
                              window.speechSynthesis.cancel();
                              const u = new SpeechSynthesisUtterance(`${leadArticle.title}. ${leadArticle.snippet}`);
                              window.speechSynthesis.speak(u);
                            }}
                            className="bg-white/10 p-2 rounded-full text-gray-300 hover:text-[var(--color-nexus-red)] hover:bg-white transition-colors"
                            title="Read Aloud"
                          >
                            <Volume2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleBookmarkToggle(leadArticle)}
                            className={`bg-white/10 p-2 rounded-full transition-colors ${bookmarks.some(b => b.id === leadArticle.id) ? 'text-[var(--color-nexus-red)] bg-white/20' : 'text-gray-300 hover:text-[var(--color-nexus-red)] hover:bg-white'}`}
                            title="Bookmark"
                          >
                            <Bookmark className="w-5 h-5" fill={bookmarks.some(b => b.id === leadArticle.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-nexus-red)] mb-4 inline-block">NEXUS EDITORIAL</h3>
                        <button onClick={() => handleSelectArticle(leadArticle)} className="block text-left">
                           <h2 className="font-serif text-3xl md:text-5xl font-black leading-tight hover:text-[var(--color-nexus-red)] transition-colors">
                             {leadArticle.title}
                           </h2>
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-4 mt-3">
                      <span className="bg-[#111111] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                        {leadArticle.source}
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm">
                        {leadArticle.category}
                      </span>
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ml-auto">
                        {!isPastDate ? formatDistanceToNow(new Date(leadArticle.pubDate), { addSuffix: true }) : format(new Date(leadArticle.pubDate), 'MMM do')}
                      </span>
                    </div>
                    
                    {leadArticle.thumbnail && (
                      <button onClick={() => handleSelectArticle(leadArticle)} className="block text-left">
                        <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 leading-tight mb-2 hover:text-[#D32F2F]">
                          {leadArticle.title}
                        </h2>
                      </button>
                    )}
                    
                    <p className="text-stone-600 text-sm leading-relaxed mb-4">
                      {leadArticle.snippet}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <button onClick={() => handleSelectArticle(leadArticle)} className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--color-nexus-red)] uppercase tracking-widest hover:border-b-2 hover:border-[var(--color-nexus-red)] pb-1">
                        Read Full Story <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={async () => {
                          if (navigator.share) {
                            try { await navigator.share({ title: leadArticle.title, text: leadArticle.snippet, url: leadArticle.link }); } catch (err) {}
                          } else {
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(leadArticle.title)}&url=${encodeURIComponent(leadArticle.link)}`, '_blank');
                          }
                        }}
                        className="text-gray-400 hover:text-[var(--color-nexus-red)] transition-colors flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share
                      </button>
                    </div>
                  </div>
                </div>

                {/* Secondary Stack (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-[var(--color-nexus-red)]"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest font-sans">Top Stories</h3>
                  </div>
                  
                  {heroSidebarArticles.map((article) => (
                    <article key={article.id} className="group border-b border-[var(--color-nexus-border)] pb-6 last:border-0 last:pb-0 relative">
                      <button onClick={() => handleSelectArticle(article)} className="flex items-start gap-4 text-left w-full">
                        <div className="flex-grow">
                          <span className="text-[var(--color-nexus-red)] text-[10px] font-black uppercase tracking-widest mb-1 block">
                            {article.source}
                          </span>
                          <h4 className="text-[var(--color-nexus-dark)] text-lg font-bold leading-snug group-hover:text-[var(--color-nexus-red)] transition-colors font-serif line-clamp-2 mb-2 pr-6">
                            {article.title}
                          </h4>
                          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            {!isPastDate ? formatDistanceToNow(new Date(article.pubDate), { addSuffix: true }) : format(new Date(article.pubDate), 'MMM do')}
                            <span className="bg-gray-100 text-gray-500 text-[8px] px-1.5 py-0.5 rounded-sm">
                              {article.category}
                            </span>
                          </div>
                        </div>
                        {article.thumbnail && (
                          <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-100 hidden sm:block">
                            <Image
                              src={article.thumbnail}
                              alt={article.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          </div>
                        )}
                      </button>
                      
                      {/* Mini Bookmark Overlay */}
                      <button 
                        onClick={(e) => { e.preventDefault(); handleBookmarkToggle(article); }}
                        className="absolute top-0 right-0 p-1 text-gray-400 hover:text-[var(--color-nexus-red)] bg-white"
                      >
                        <Bookmark className="w-4 h-4" fill={bookmarks.some(b => b.id === article.id) ? 'currentColor' : 'none'} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Grid Section (Main 8 + Sidebar 4) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               
               {/* Left: 2-Column Main Grid */}
               <div className="lg:col-span-8">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {feedGridArticles.map(article => (
                    <NewsCard 
                      key={article.id} 
                      article={article} 
                      isPastDate={isPastDate}
                      fontSizeClass={fontSize}
                      isBookmarked={bookmarks.some(b => b.id === article.id)}
                      onBookmarkToggle={handleBookmarkToggle}
                      onClick={() => handleSelectArticle(article)}
                    />
                  ))}
                 </div>
               </div>

               {/* Right: Sticky Classical Sidebar */}
               <div className="lg:col-span-4 flex flex-col gap-10">
                  
                  {/* Solid Newsletter Card */}
                  <div className="bg-[var(--color-nexus-dark)] text-white p-8 lg:p-10 text-center flex flex-col items-center">
                     <Mail className="w-10 h-10 mb-6 text-[var(--color-nexus-red)]" />
                     <h3 className="text-2xl font-black uppercase mb-3 tracking-tight font-serif">Daily Briefing</h3>
                     <p className="text-gray-400 text-sm mb-8 leading-relaxed font-sans">
                       Get the most important intelligence delivered directly to your inbox.
                     </p>
                     <input 
                       type="email" 
                       placeholder="Enter your email" 
                       className="w-full bg-white/10 text-white border border-gray-700 px-4 py-3.5 mb-4 text-sm font-sans focus:outline-none focus:border-[var(--color-nexus-red)] placeholder-gray-500" 
                     />
                     <button className="w-full bg-[var(--color-nexus-red)] text-white uppercase tracking-widest text-xs font-black py-4 hover:bg-red-800 transition-colors">
                       Subscribe
                     </button>
                  </div>

                  {/* Trending Tag Cloud */}
                  <div className="bg-white border border-[var(--color-nexus-border)] p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-[var(--color-nexus-border)] pb-4 font-sans">Trending Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {['UPSC', 'Economy', 'Science', 'World', 'Space', 'Election'].map(tag => (
                        <button 
                          key={tag}
                          onClick={() => setSearchQuery(tag)} 
                          className="bg-[var(--color-nexus-bg)] border border-[var(--color-nexus-border)] text-[var(--color-nexus-dark)] text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-[var(--color-nexus-red)] hover:text-white hover:border-[var(--color-nexus-red)] cursor-pointer transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Official Links */}
                  <div className="bg-white border border-[var(--color-nexus-border)] p-8 sticky top-24">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-[var(--color-nexus-border)] pb-4 font-sans">Official Portals</h3>
                    <ul className="flex flex-col gap-1">
                      <li>
                        <a href="https://upsc.gov.in/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm font-bold text-gray-600 hover:text-[var(--color-nexus-red)] transition-colors py-2 border-b border-gray-100 last:border-0 uppercase tracking-widest">
                          UPSC Official <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
                        </a>
                      </li>
                      <li>
                        <a href="https://pib.gov.in/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm font-bold text-gray-600 hover:text-[var(--color-nexus-red)] transition-colors py-2 border-b border-gray-100 last:border-0 uppercase tracking-widest">
                          Press Info Bureau <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
                        </a>
                      </li>
                      <li>
                        <a href="https://ssc.nic.in/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm font-bold text-gray-600 hover:text-[var(--color-nexus-red)] transition-colors py-2 border-b border-gray-100 last:border-0 uppercase tracking-widest">
                          SSC Portal <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
                        </a>
                      </li>
                      <li>
                        <a href="https://www.isro.gov.in/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm font-bold text-gray-600 hover:text-[var(--color-nexus-red)] transition-colors py-2 border-b border-gray-100 last:border-0 uppercase tracking-widest">
                          ISRO Portal <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
                        </a>
                      </li>
                    </ul>
                  </div>

               </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[var(--color-nexus-dark)] text-white pt-20 pb-10 mt-auto border-t-[8px] border-[var(--color-nexus-red)]">
        <div className="max-w-[1400px] mx-auto px-4">
           <div className="flex flex-col md:flex-row justify-between items-center mb-16 border-b border-gray-800 pb-16">
             <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter font-serif">
                NEXUS<span className="text-[var(--color-nexus-red)] ml-2">NEWS</span>
             </h2>
             <div className="flex gap-8 text-xs font-black uppercase tracking-widest text-gray-400 mt-8 md:mt-0">
                <span className="cursor-pointer hover:text-white transition-colors">Facebook</span>
                <span className="cursor-pointer hover:text-white transition-colors">Twitter</span>
                <span className="cursor-pointer hover:text-white transition-colors">Instagram</span>
             </div>
           </div>
           
           <div className="mb-12 border-b border-gray-800 pb-12">
             <h4 className="text-gray-300 font-bold uppercase tracking-widest text-xs mb-3">Fair Use & Source Attribution Disclaimer</h4>
             <p className="text-gray-500 text-[10px] md:text-xs leading-relaxed max-w-4xl">
               NEXUS NEWS is a non-storage editorial curator aggregating publicly accessible dispatches for students and competitive exam aspirants. 
               This application does not permanently store articles, databases, or proprietary media. Full attribution and copyright belong strictly to the original publishers (e.g., The Hindu, Press Information Bureau, LiveMint, BBC).
             </p>
           </div>
           
           <nav aria-label="Quick Search Desks" className="mb-12 border-b border-gray-800 pb-12">
             <h4 className="text-gray-300 font-bold uppercase tracking-widest text-xs mb-4">Trending Search Desks</h4>
             <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500 tracking-widest uppercase">
               <a href="#" className="hover:text-white transition-colors">UPSC Prelims Daily Current Affairs</a>
               <span className="text-gray-700">|</span>
               <a href="#" className="hover:text-white transition-colors">PIB Daily Summary</a>
               <span className="text-gray-700">|</span>
               <a href="#" className="hover:text-white transition-colors">Sarkari Result Exam Alerts</a>
               <span className="text-gray-700">|</span>
               <a href="#" className="hover:text-white transition-colors">Daily Geopolitics News</a>
             </div>
           </nav>
           
           <div className="flex flex-col md:flex-row justify-between items-center text-xs font-bold text-gray-500 tracking-widest uppercase">
             <p>&copy; {new Date().getFullYear()} Nexus News. All rights reserved.</p>
             <div className="flex gap-8 mt-6 md:mt-0">
               <a href="#" className="hover:text-white transition-colors">Privacy</a>
               <a href="#" className="hover:text-white transition-colors">Terms</a>
               <a href="#" className="hover:text-white transition-colors">Contact</a>
             </div>
           </div>
        </div>
      </footer>

      <ArticleModal 
        article={selectedArticle}
        onClose={() => handleSelectArticle(null)}
        isPastDate={isPastDate}
        isBookmarked={selectedArticle ? bookmarks.some(b => b.id === selectedArticle.id) : false}
        onBookmarkToggle={handleBookmarkToggle}
      />
    </div>
  );
}


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
