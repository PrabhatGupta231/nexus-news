'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, Volume2, X } from 'lucide-react';

interface Article {
  title: string;
  source?: string;
  category?: string;
}

interface AudioNewsPlayerProps {
  articles: Article[];
  lang?: string;
}

export default function AudioNewsPlayer({ articles = [], lang = 'en' }: AudioNewsPlayerProps) {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const topArticles = articles.slice(0, 10);
  const totalArticles = topArticles.length;

  useEffect(() => {
    setMounted(true);
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const playArticle = (index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !topArticles[index]) return;
    
    window.speechSynthesis.cancel();
    const article = topArticles[index];
    const isHindi = lang === 'hi';
    const prefix = isHindi ? `ख़बर नंबर ${index + 1}:` : `Headline ${index + 1}:`;
    const text = `${prefix} ${article.title}`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    
    utterance.onend = () => {
      if (index + 1 < totalArticles) {
        setCurrentIndex(index + 1);
        playArticle(index + 1);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentIndex(0);
      }
    };
    
    utterance.onerror = (e) => {
      console.error('SpeechSynthesisError:', e);
      // Move to next anyway on error to avoid being stuck? Or just stop.
      // We'll just stop.
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const startPlaying = () => {
    if (totalArticles === 0) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      setCurrentIndex(0);
      playArticle(0);
    }
  };

  const pausePlaying = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const stopPlaying = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
  };

  if (!mounted || typeof window === 'undefined' || !window.speechSynthesis) {
    return null;
  }

  const currentArticleTitle = topArticles[currentIndex]?.title || '';
  const truncatedTitle = currentArticleTitle.length > 40 ? currentArticleTitle.substring(0, 40) + '...' : currentArticleTitle;

  return (
    <>
      <button
        onClick={isPlaying && !isPaused ? pausePlaying : startPlaying}
        disabled={totalArticles === 0}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${
          isPlaying 
            ? 'bg-red-600 text-white border border-red-500 hover:bg-red-700 animate-pulse-slow'
            : 'bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700'
        } ${totalArticles === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={lang === 'hi' ? 'टॉप खबरें सुनें' : 'Listen Top News'}
      >
        <Volume2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {isPlaying && !isPaused ? 'PLAYING...' : (lang === 'hi' ? 'टॉप खबरें सुनें' : 'LISTEN TOP 10')}
        </span>
      </button>

      {isPlaying && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] border border-neutral-700 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-4 text-white text-xs whitespace-nowrap">
          <span className="bg-red-600/20 text-red-400 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
            #{currentIndex + 1} of {totalArticles}
          </span>
          <span className="font-medium truncate max-w-[150px] sm:max-w-[250px] md:max-w-[400px]">
            {truncatedTitle}
          </span>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-neutral-700">
            {isPaused ? (
              <button onClick={startPlaying} className="p-1 hover:text-red-400 transition-colors" title="Resume">
                <Play className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button onClick={pausePlaying} className="p-1 hover:text-red-400 transition-colors" title="Pause">
                <Pause className="w-4 h-4 fill-current" />
              </button>
            )}
            <button onClick={stopPlaying} className="p-1 text-gray-400 hover:text-white transition-colors" title="Stop">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
