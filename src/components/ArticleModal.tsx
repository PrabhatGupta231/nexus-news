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
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState<boolean>(true);

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
      setFullContent(null);
      window.speechSynthesis.cancel();
      
      // Initialize display with description/snippet if available
      if (article.content || article.snippet) {
        setFullContent(article.content || article.snippet);
      }
      setLoadingContent(true);
      
      // Fetch full content
      fetch(`/api/article-content?url=${encodeURIComponent(article.link)}`)
        .then(res => res.json())
        .then(data => {
          if (data?.content) {
            setFullContent(data.content);
          }
        })
        .catch(() => {
          // Keep whatever was initially set
        })
        .finally(() => {
          setLoadingContent(false);
        });

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
    
    // strip HTML tags from fullContent for reading
    let textToRead = '';
    if (fullContent) {
      const temp = document.createElement('div');
      temp.innerHTML = fullContent;
      textToRead = temp.textContent || temp.innerText || '';
    } else {
      textToRead = article.snippet;
    }
    
    textToRead = `${article.title}. ${textToRead}`;
    
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-[#FDFBF7] text-stone-900 p-6 md:p-8 rounded-xl shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-white shadow-sm border border-stone-200 hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors z-10" 
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Actions (Moved below close button or integrated) */}
        <div className="flex items-center gap-3 mb-6 pr-12">
          <span className="bg-[#991B1B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
            {article.source}
          </span>
          <span className="text-stone-500 text-xs font-bold uppercase tracking-widest">
            {!isPastDate ? formatDistanceToNow(new Date(article.pubDate), { addSuffix: true }) : format(new Date(article.pubDate), 'MMMM do, yyyy')}
          </span>
        </div>


        <h1 className="text-xl md:text-2xl font-bold font-serif leading-snug mb-4 text-stone-950">
          {article.title}
        </h1>
          
          {/* Separator rule */}
          <div className="border-b border-[#E7E5E0] my-4"></div>

          {article.thumbnail && !imageError && (
            <div className="relative w-full aspect-video my-6 bg-gray-100 rounded-lg overflow-hidden border border-[#E7E5E0]">
              <Image 
                src={article.thumbnail} 
                alt={article.title} 
                fill 
                className="object-cover" 
                onError={() => setImageError(true)}
              />
            </div>
          )}

          <div className="prose prose-lg max-w-none mb-8">
            <style jsx global>{`
              .article-body p { margin-bottom: 1.5rem; }
            `}</style>
            
            {loadingContent && !fullContent && !article.content ? (
              <>
                <p className="text-[16px] md:text-[17px] leading-relaxed text-stone-800 font-serif">
                  {article.snippet}
                </p>
                <div className="flex items-center justify-center p-8 text-stone-400 font-sans text-sm animate-pulse">
                   लोड हो रहा है... (Fetching complete story)
                </div>
              </>
            ) : fullContent ? (
              <div 
                className="text-[16px] md:text-[17px] leading-relaxed text-stone-800 font-serif space-y-4 article-body" 
                dangerouslySetInnerHTML={{ __html: fullContent }} 
              />
            ) : (
              <p className="text-[16px] md:text-[17px] leading-relaxed text-stone-800 font-serif">
                {article.snippet}
              </p>
            )}
          </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={handleTTS} className="p-2.5 rounded-full hover:bg-stone-200/60 text-stone-600 transition-colors" title="Read Aloud">
              {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button onClick={handleShare} className="p-2.5 rounded-full hover:bg-stone-200/60 text-stone-600 transition-colors" title="Share">
              <Share2 className="w-5 h-5" />
            </button>
            {onBookmarkToggle && (
              <button onClick={() => onBookmarkToggle(article)} className={`p-2.5 rounded-full hover:bg-stone-200/60 transition-colors ${isBookmarked ? 'text-[#991B1B]' : 'text-stone-600'}`} title="Bookmark">
                <Bookmark className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
          <a 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-stone-900 hover:bg-[#991B1B] text-white text-xs font-bold tracking-wide transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            Read on {article.source} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
