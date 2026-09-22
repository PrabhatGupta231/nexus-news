import { NewsItem } from '@/app/api/news/route';

interface BreakingTickerProps {
  articles: NewsItem[];
}

export default function BreakingTicker({ articles }: BreakingTickerProps) {
  if (!articles || articles.length === 0) return null;

  // Duplicate the array once to create a seamless loop
  const loopItems = [...articles, ...articles];

  return (
    <div className="flex items-center overflow-hidden w-full md:max-w-[50%] h-full relative">
      {/* Fixed Sticky Badge */}
      <div className="bg-[var(--color-nexus-red)] text-white font-bold uppercase px-3 py-0.5 tracking-wider text-[10px] sm:text-xs z-10 flex-shrink-0 shadow-[4px_0_10px_rgba(0,0,0,0.5)] h-full flex items-center">
        FLASH NEWS
      </div>

      {/* Marquee Container */}
      <div className="flex-1 overflow-hidden group ml-4 pl-2 z-10">
        <div className="animate-marquee group-hover:[animation-play-state:paused] flex items-center gap-6 whitespace-nowrap">
          {loopItems.map((article, idx) => (
            <div key={`${article.id}-${idx}`} className="flex items-center gap-6">
              <a 
                href={article.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-medium text-stone-100 hover:text-red-300 tracking-wide transition-colors font-sans"
              >
                {article.title}
              </a>
              {/* Separator Dot */}
              <span className="text-[#D32F2F] text-[8px] opacity-70">●</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
