'use client';

import { useEffect, useState, useRef } from 'react';
import { NewsItem } from '@/app/api/news/route';
import { X } from 'lucide-react';

interface NotificationManagerProps {
  onNewArticleSelect: (article: NewsItem) => void;
  lang?: string;
}

export default function NotificationManager({ onNewArticleSelect, lang = 'en' }: NotificationManagerProps) {
  const [toastArticle, setToastArticle] = useState<NewsItem | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Fallback synthetic ping sound if no mp3 is provided
  const playPing = () => {
    if (!audioEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  useEffect(() => {
    // Initial fetch to set the baseline latest article
    const initBaseline = async () => {
      try {
        const hasPermission = localStorage.getItem('nexus_notifications') === 'granted';
        if (!hasPermission) return;
        
        const res = await fetch(`/api/news?category=all&lang=${lang}`);
        if (res.ok) {
          const data = await res.json();
          const articles: NewsItem[] = data.articles || [];
          if (articles.length > 0) {
             const currentLink = localStorage.getItem(`nexus_latest_link_${lang}`);
             if (!currentLink) {
               localStorage.setItem(`nexus_latest_link_${lang}`, articles[0].link);
             }
          }
        }
      } catch (err) {}
    };
    initBaseline();

    const interval = setInterval(async () => {
       const hasPermission = localStorage.getItem('nexus_notifications') === 'granted';
       if (!hasPermission) return;
       
       try {
         const res = await fetch(`/api/news?category=all&lang=${lang}`);
         if (res.ok) {
           const data = await res.json();
           const articles: NewsItem[] = data.articles || [];
           if (articles.length > 0) {
             const latestArticle = articles[0];
             const lastSeenLink = localStorage.getItem(`nexus_latest_link_${lang}`);
             
             if (lastSeenLink && lastSeenLink !== latestArticle.link) {
               // New article detected
               localStorage.setItem(`nexus_latest_link_${lang}`, latestArticle.link);
               
               // In-app Toast
               setToastArticle(latestArticle);
               playPing();
               
               // Browser notification
               if (Notification.permission === 'granted') {
                 const notif = new Notification(latestArticle.title, {
                   body: latestArticle.source || 'Breaking News on Nexus News',
                 });
                 
                 notif.onclick = function() {
                   window.focus();
                   onNewArticleSelect(latestArticle);
                   this.close();
                 };
               }
               
               // Auto dismiss toast after 6s
               setTimeout(() => {
                 setToastArticle(null);
               }, 6000);
             } else if (!lastSeenLink) {
               localStorage.setItem(`nexus_latest_link_${lang}`, latestArticle.link);
             }
           }
         }
       } catch (err) {}
    }, 90000); // 90 seconds
    
    return () => clearInterval(interval);
  }, [lang, onNewArticleSelect, audioEnabled]);

  if (!toastArticle) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
      <div className="bg-[#1C1917] border-l-4 border-[#EF4444] shadow-2xl rounded-sm p-5 w-80 max-w-[calc(100vw-2rem)] flex flex-col relative overflow-hidden">
        <button 
          onClick={() => setToastArticle(null)}
          className="absolute top-2 right-2 text-stone-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mb-3">
           <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-ping absolute opacity-75"></div>
           <div className="w-2 h-2 rounded-full bg-[#EF4444] relative z-10 mx-0.5"></div>
           <span className="text-[#EF4444] text-[10px] font-black uppercase tracking-widest ml-1">
             BREAKING ALERT
           </span>
        </div>
        <h4 className="text-white text-sm font-bold font-serif leading-snug mb-4 line-clamp-3">
          {toastArticle.title}
        </h4>
        <button 
          onClick={() => {
            onNewArticleSelect(toastArticle);
            setToastArticle(null);
          }}
          className="w-full bg-white/10 hover:bg-[#EF4444] text-white text-[11px] font-black uppercase tracking-widest py-2.5 rounded transition-colors"
        >
          Read Now
        </button>
      </div>
    </div>
  );
}
