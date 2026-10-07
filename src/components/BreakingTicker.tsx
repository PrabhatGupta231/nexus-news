import { NewsItem } from '@/app/api/news/route';

interface BreakingTickerProps {
  articles: NewsItem[];
}

export default function BreakingTicker({ articles }: BreakingTickerProps) {
  if (!articles || articles.length === 0) return null;

  // Duplicate the array once to create a seamless loop
  const loopItems = [...articles, ...articles];

  return (
    <div className="flex items-center gap-2 w-full h-full">
      <span className="bg-[#D32F2F] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider flex-shrink-0">
        FLASH NEWS
      </span>
      <div className="flex-1 overflow-hidden group z-10">
        <div className="animate-marquee group-hover:[animation-play-state:paused] flex items-center gap-6 whitespace-nowrap">
          {loopItems.map((article, idx) => (
            <div key={`${article.id}-${idx}`} className="flex items-center gap-6">
              <a 
                href={article.link} 
                target="_blank" 
                rel="noopener noreferrer nofollow"
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
