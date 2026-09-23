'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, Bookmark, Share2, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { NewsItem } from '@/app/api/news/route';
import { formatDistanceToNow, format } from 'date-fns';

interface ArticleModalProps {
  article: NewsItem | null;
  onClose: () => void;
  isPastDate?: boolean;
  isBookmarked?: boolean;
  onBookmarkToggle?: (article: NewsItem) => void;
}

export default function ArticleModal({ article, onClose, isPastDate, isBookmarked, onBookmarkToggle }: ArticleModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onClose, isPlaying]);

  useEffect(() => {
    if (article) {
      document.body.style.overflow = 'hidden';
      setImageError(false);
      setIsPlaying(false);
      window.speechSynthesis.cancel();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [article]);

  if (!article) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.snippet,
          url: article.link,
        });
      } catch (err) {}
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(article.link)}`, '_blank');
    }
  };

  const handleTTS = () => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl rounded-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--color-nexus-border)] bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm">
              {article.source}
            </span>
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              {!isPastDate ? formatDistanceToNow(new Date(article.pubDate), { addSuffix: true }) : format(new Date(article.pubDate), 'MMMM do, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleTTS} className="p-2 text-gray-500 hover:text-[var(--color-nexus-red)] transition-colors" title="Read Aloud">
              {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button onClick={handleShare} className="p-2 text-gray-500 hover:text-[var(--color-nexus-red)] transition-colors" title="Share">
              <Share2 className="w-5 h-5" />
            </button>
            {onBookmarkToggle && (
              <button onClick={() => onBookmarkToggle(article)} className={`p-2 transition-colors ${isBookmarked ? 'text-[var(--color-nexus-red)]' : 'text-gray-500 hover:text-[var(--color-nexus-red)]'}`} title="Bookmark">
                <Bookmark className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
            )}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 transition-colors" title="Close">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 md:p-10 flex-grow bg-white">
          <h1 className="text-3xl md:text-5xl font-serif font-black text-stone-900 leading-tight mb-8">
            {article.title}
          </h1>
          
          {article.thumbnail && !imageError && (
            <div className="relative w-full aspect-video mb-8 bg-gray-100 rounded-sm overflow-hidden border border-[var(--color-nexus-border)]">
              <Image 
                src={article.thumbnail} 
                alt={article.title} 
                fill 
                className="object-cover" 
                onError={() => setImageError(true)}
              />
            </div>
          )}

          <div className="prose prose-lg max-w-none font-sans text-stone-700 leading-relaxed mb-8">
            <p className="text-xl md:text-2xl leading-relaxed text-stone-600 font-serif mb-6">
              {article.snippet}
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-[var(--color-nexus-border)] bg-gray-50 flex justify-center shrink-0">
          <a 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[var(--color-nexus-dark)] hover:bg-[var(--color-nexus-red)] text-white px-8 py-4 text-xs font-black uppercase tracking-widest transition-colors w-full md:w-auto justify-center"
          >
            Source: {article.source} (Read on Official Portal) <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
