"use client";

import { getF1News, F1NewsItem } from "@/services/newsService";
import { NewsCard, NewsCardSkeleton } from "@/components/media/NewsCard";
import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";

export default function NewsPage() {
  const [news, setNews] = useState<F1NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNews() {
      try {
        const data = await getF1News();
        setNews(data);
      } catch (err) {
        setError("Failed to load news");
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, []);

  return (
    <div className="w-full max-w-[1920px] mx-auto animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col gap-2 border-b border-[var(--color-border-subtle)] pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-[var(--color-f1-red)]" />
          F1 News Center
        </h1>
        <p className="text-gray-400">The latest news, insights, and updates from the paddock.</p>
      </header>

      {error && (
        <div className="p-8 text-center text-[var(--color-f1-red)] bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      ) : news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {news.map(article => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center text-gray-500 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
          ยังไม่มีข่าวสำหรับรายการนี้ (No news available at the moment)
        </div>
      )}
    </div>
  );
}
