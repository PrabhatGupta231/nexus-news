'use client';

import Image from 'next/image';
import { formatDistanceToNow, format } from 'date-fns';
import { ExternalLink, Bookmark, Share2, Volume2, VolumeX } from 'lucide-react';
import { NewsItem } from '@/app/api/news/route';
import { useState, useEffect } from 'react';

interface NewsCardProps {
  article: NewsItem;
  isPastDate?: boolean;
  fontSizeClass?: string;
  isBookmarked?: boolean;
  onBookmarkToggle?: (article: NewsItem) => void;
}

export default function NewsCard({ 
  article, 
  isPastDate = false, 
  fontSizeClass = 'text-base',
  isBookmarked = false,
  onBookmarkToggle
}: NewsCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Cleanup speech when unmounting
    return () => {
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.snippet,
          url: article.link,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(article.link)}`, '_blank');
    }
  };

  const handleTTS = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const textToRead = `${article.title}. ${article.snippet}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <article className="group flex flex-col bg-white border border-[var(--color-nexus-border)] shadow-sm hover:shadow-md transition-shadow h-full rounded-sm overflow-hidden relative">
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button 
          onClick={handleTTS}
          className="bg-white/90 p-1.5 rounded-full shadow-sm text-gray-600 hover:text-[var(--color-nexus-red)] transition-colors"
          title="Read Aloud"
        >
          {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        {onBookmarkToggle && (
          <button 
            onClick={(e) => { e.preventDefault(); onBookmarkToggle(article); }}
            className={`bg-white/90 p-1.5 rounded-full shadow-sm transition-colors ${isBookmarked ? 'text-[var(--color-nexus-red)]' : 'text-gray-600 hover:text-[var(--color-nexus-red)]'}`}
            title="Bookmark"
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* Image Container (Fixed Aspect Ratio) */}
      <div className="relative w-full pt-[56.25%] overflow-hidden bg-gray-100">
        {article.thumbnail ? (
          <Image
            src={article.thumbnail}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200"></div>
        )}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-white text-[var(--color-nexus-dark)] text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm">
            {article.source}
          </span>
        </div>
      </div>

      {/* Content Container (Separated) */}
      <div className="p-6 flex flex-col flex-grow bg-white">
        <div className="flex justify-between items-start mb-3">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            {!isPastDate ? (
               <span className="flex items-center gap-1.5 text-[var(--color-nexus-red)]">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-nexus-red)] opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-nexus-red)]"></span>
                 </span>
                 {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
               </span>
            ) : (
               format(new Date(article.pubDate), 'MMMM do, yyyy')
            )}
          </div>
          <div className="flex items-center gap-2">
            {article.category === 'current-affairs' && (
              <span className="bg-[#D32F2F] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-sm">
                EXAM DESK
              </span>
            )}
            <span className="bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm">
              {article.category === 'current-affairs' ? 'CURRENT AFFAIRS' : article.category}
            </span>
          </div>
        </div>
        
        <h4 className={`text-[var(--color-nexus-dark)] font-bold leading-snug mb-3 group-hover:text-[var(--color-nexus-red)] transition-colors font-serif ${fontSizeClass === 'text-sm' ? 'text-lg md:text-xl' : fontSizeClass === 'text-lg' ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>
          {article.title}
        </h4>
        
        <p className={`text-gray-600 mb-6 line-clamp-3 leading-relaxed flex-grow font-sans ${fontSizeClass === 'text-sm' ? 'text-xs' : fontSizeClass === 'text-lg' ? 'text-base' : 'text-sm'}`}>
          {article.snippet}
        </p>
        
        <div className="flex justify-between items-center mt-auto">
          <a 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--color-nexus-dark)] hover:text-[var(--color-nexus-red)] transition-colors uppercase tracking-widest border-b-2 border-transparent hover:border-[var(--color-nexus-red)] pb-1"
          >
            Read Full Story <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button 
            onClick={handleShare}
            className="text-gray-400 hover:text-[var(--color-nexus-red)] transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
