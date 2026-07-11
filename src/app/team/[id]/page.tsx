"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Shield, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { getF1News, F1NewsItem } from "@/services/newsService";
import { NewsCard, NewsCardSkeleton } from "@/components/media/NewsCard";

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const teamName = decodeURIComponent(params.id as string);
  const { year } = useAppStore();

  const [news, setNews] = useState<F1NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    if (teamName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingNews(true);
      getF1News(teamName)
        .then(data => setNews(data))
        .catch(() => setNews([]))
        .finally(() => setLoadingNews(false));
    }
  }, [teamName]);

  const getTeamCarUrl = (name: string) => {
    if (year === 2026) {
      const strippedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `/cars/2026/2026${strippedName}carright.avif`;
    }

    const map: Record<string, string> = {
      'Mercedes': 'mercedes',
      'Ferrari': 'ferrari',
      'McLaren': 'mclaren',
      'Red Bull Racing': 'red-bull-racing',
      'Alpine': 'alpine',
      'Racing Bulls': 'rb',
      'Haas F1 Team': 'haas-f1-team',
      'Williams': 'williams',
      'Aston Martin': 'aston-martin',
      'Audi': 'kick-sauber', // Fallback to Kick Sauber for 2024
      'Cadillac': 'generic',
      'Kick Sauber': 'kick-sauber',
    };
    const slug = map[name] || name.toLowerCase().replace(/\s+/g, '-');
    // We hardcode 2024 here because the F1 CDN doesn't have 2026 car images yet and returns a grey silhouette fallback.
    return `https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/${slug}.png.transform/9col/image.png`;
  };

  const getTeamColor = (name: string) => {
    const map: Record<string, string> = {
      'Mercedes': '27F4D2',
      'Ferrari': 'E80020',
      'McLaren': 'FF8000',
      'Red Bull Racing': '3671C6',
      'Alpine': '0093CC', 
      'Racing Bulls': '6692FF',
      'Haas F1 Team': 'B6BABD',
      'Williams': '64C4FF',
      'Aston Martin': '229971',
      'Audi': 'E02626', 
      'Cadillac': 'FFC000',
      'Kick Sauber': '52E252',
    };
    return map[name] || '333333';
  };

  const teamColor = getTeamColor(teamName);

  return (
    <div className="w-full max-w-[1920px] mx-auto animate-in fade-in duration-500 space-y-8">
      <header 
        className="flex items-end justify-between border-b border-[var(--color-border-subtle)] pb-6 relative overflow-hidden rounded-xl p-8 h-64 md:h-80 shadow-2xl group"
        style={{
          background: `linear-gradient(135deg, #${teamColor} 0%, rgba(0,0,0,0.95) 100%)`,
          borderTop: `4px solid #${teamColor}`
        }}
      >
        
        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          <button 
            onClick={() => router.back()} 
            className="text-gray-500 hover:text-white flex items-center gap-2 w-fit transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="mt-auto">
            <p className="text-[var(--color-f1-red)] font-black text-xl uppercase tracking-widest">Constructor</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mt-1 uppercase">
              {teamName}
            </h1>
          </div>
        </div>

        <img 
          src={getTeamCarUrl(teamName)}
          alt={`${teamName} car`}
          className="absolute right-[-5%] md:right-4 bottom-4 md:bottom-8 h-32 md:h-48 object-contain drop-shadow-2xl z-0 transition-transform hover:scale-105"
          onError={(e) => {
             e.currentTarget.style.display = 'none';
          }}
        />
        
        <div className="absolute top-0 right-0 p-8 opacity-5 z-0 pointer-events-none">
           <Shield className="w-48 h-48 md:w-64 md:h-64" />
        </div>
      </header>

      {/* Team News Section */}
      <section>
        <h2 className="text-xl font-bold mb-6 border-l-4 border-[var(--color-f1-red)] pl-3 flex items-center gap-2">
          <Newspaper className="w-5 h-5"/> Latest News for {teamName}
        </h2>
        
        {loadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {news.slice(0, 8).map(article => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center text-gray-500 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
            ยังไม่มีข่าวสำหรับทีมนี้ (No recent news found for {teamName})
          </div>
        )}
      </section>
    </div>
  );
}
