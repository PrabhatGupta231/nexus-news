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
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true);
      window.speechSynthesis.cancel();
      
      // Fetch full content
      fetch(`/api/article-content?url=${encodeURIComponent(article.link)}`)
        .then(res => res.json())
        .then(data => {
          if (data.content) {
            setFullContent(data.content);
          } else {
            // Fallback to original snippet if extraction fails or yields little text
            setFullContent(`<p>${article.snippet}</p>`);
          }
        })
        .catch(() => {
          setFullContent(`<p>${article.snippet}</p>`);
        })
        .finally(() => {
          setIsLoading(false);
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
      <div className="relative bg-[#FAFAF7] border border-[#E7E5E0] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center p-4 md:px-8 border-b border-[#E7E5E0] bg-[#FAFAF7] shrink-0">
          <div className="flex items-center gap-3">
            <span className="bg-[#991B1B] text-white text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">
              {article.source}
            </span>
            <span className="text-stone-500 text-xs font-medium tracking-normal">
              {!isPastDate ? formatDistanceToNow(new Date(article.pubDate), { addSuffix: true }) : format(new Date(article.pubDate), 'MMMM do, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleTTS} className="p-2 rounded-full hover:bg-stone-200/60 text-stone-600 transition-colors" title="Read Aloud">
              {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button onClick={handleShare} className="p-2 rounded-full hover:bg-stone-200/60 text-stone-600 transition-colors" title="Share">
              <Share2 className="w-5 h-5" />
            </button>
            {onBookmarkToggle && (
              <button onClick={() => onBookmarkToggle(article)} className={`p-2 rounded-full hover:bg-stone-200/60 transition-colors ${isBookmarked ? 'text-[#991B1B]' : 'text-stone-600'}`} title="Bookmark">
                <Bookmark className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
            )}
            <div className="w-px h-5 bg-[#E7E5E0] mx-2"></div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-200/60 text-stone-600 transition-colors" title="Close">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 md:p-10 flex-grow bg-[#FAFAF7]">
          <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-[#1C1917] leading-[1.3] mb-4 tracking-tight">
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
            
            {isLoading ? (
              <>
                <p className="font-serif text-[17px] md:text-[18px] text-[#292524] leading-[1.8] font-normal tracking-wide">
                  {article.snippet}
                </p>
                <div className="flex items-center justify-center p-8 text-stone-400 font-sans text-sm animate-pulse">
                   लोड हो रहा है... (Fetching complete story)
                </div>
              </>
            ) : fullContent ? (
              <div 
                className="font-serif text-[17px] md:text-[18px] text-[#292524] leading-[1.8] font-normal tracking-wide space-y-4 article-body" 
                dangerouslySetInnerHTML={{ __html: fullContent }} 
              />
            ) : (
              <p className="font-serif text-[17px] md:text-[18px] text-[#292524] leading-[1.8] font-normal tracking-wide">
                {article.snippet}
              </p>
            )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-[#E7E5E0] bg-[#FAFAF7] flex justify-center shrink-0">
          <a 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1C1917] hover:bg-[#991B1B] text-white text-xs font-medium transition-colors shadow-sm w-full md:w-auto justify-center"
          >
            Source: {article.source} (Read on Official Portal) <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
