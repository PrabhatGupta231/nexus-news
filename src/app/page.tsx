'use client';

import { useState, useEffect } from 'react';
import { NEWS_CATEGORIES, Category } from '@/config/feeds';
import { NewsItem } from '@/app/api/news/route';
import { Search, Loader2, Mail, ExternalLink, Calendar, RefreshCw, Clock, Bookmark, X, Volume2, Share2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import NewsCard from '@/components/NewsCard';
import BreakingTicker from '@/components/BreakingTicker';

type FontSize = 'text-sm' | 'text-base' | 'text-lg';

interface CategoryCounts {
  [key: string]: number | undefined;
  all: number;
  upsc: number;
  economy: number;
  science: number;
  world?: number;
}

export default function Home() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [tabCounts, setTabCounts] = useState<CategoryCounts>({ all: 0, upsc: 0, economy: 0, science: 0, world: 0 });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // New Features State
  const [fontSize, setFontSize] = useState<FontSize>('text-base');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<NewsItem[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);

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

  const fetchNews = async (category: Category, dateStr: string, isBackgroundSync = false) => {
    if (!isBackgroundSync) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?category=${category}&date=${dateStr}`);
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      setNews(data.articles || []);
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
      fetchNews(activeCategory, selectedDate);
      
      // Background polling every 10 minutes (600,000ms) ONLY if it's today's live feed
      if (!isPastDate) {
        const intervalId = setInterval(() => {
          fetchNews(activeCategory, selectedDate, true);
        }, 600000);
        return () => clearInterval(intervalId);
      }
    }
  }, [activeCategory, selectedDate, isPastDate, isClient]);

  if (!isClient) return null; // Prevent hydration mismatch

  // Filter news by search query
  const displayedNews = showBookmarks 
    ? bookmarks 
    : news.filter(article => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return article.title.toLowerCase().includes(q) || article.snippet.toLowerCase().includes(q) || article.category.toLowerCase().includes(q);
      });

  const leadArticle = displayedNews[0];
  const heroSidebarArticles = displayedNews.slice(1, 4);
  const feedGridArticles = displayedNews.slice(4);

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
          <nav className="flex overflow-x-auto hide-scrollbar">
            {NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id as Category); setShowBookmarks(false); }}
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

      <main className="flex-grow max-w-[1400px] mx-auto px-4 py-12 w-full">
        {loading ? (
          <div className="flex justify-center items-center py-32 flex-col gap-6">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-nexus-red)]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Curating the Edition...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white border border-[var(--color-nexus-border)] p-12 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 font-serif">Failed to fetch the edition</h2>
            <p className="mb-8 text-gray-500 font-sans">{error}</p>
            <button
              onClick={() => fetchNews(activeCategory, selectedDate)}
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
                    <div className="relative w-full pt-[56.25%] overflow-hidden bg-gray-100 mb-6">
                      {leadArticle.thumbnail ? (
                        <Image
                          src={leadArticle.thumbnail}
                          alt={leadArticle.title}
                          fill
                          className="object-cover transition-transform duration-1000 ease-out"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-200"></div>
                      )}
                      
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
                    
                    <a href={leadArticle.link} target="_blank" rel="noopener noreferrer" className="block">
                      <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#111111] mt-3 hover:text-[var(--color-nexus-red)] transition-colors">
                        {leadArticle.title}
                      </h2>
                    </a>
                    
                    <p className="text-stone-600 text-sm line-clamp-3 my-2 font-sans">
                      {leadArticle.snippet}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <a href={leadArticle.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--color-nexus-red)] uppercase tracking-widest hover:border-b-2 hover:border-[var(--color-nexus-red)] pb-1">
                        Read Full Story <ExternalLink className="w-3.5 h-3.5" />
                      </a>
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
                      <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4">
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
                      </a>
                      
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
    </div>
  );
}
