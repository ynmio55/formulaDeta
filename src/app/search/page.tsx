"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getF1News, F1NewsItem } from "@/services/newsService";
import { getF1Videos, F1VideoItem } from "@/services/videoService";
import { NewsCard, NewsCardSkeleton } from "@/components/media/NewsCard";
import { VideoCard, VideoCardSkeleton } from "@/components/media/VideoCard";
import { Search, Loader2 } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [news, setNews] = useState<F1NewsItem[]>([]);
  const [videos, setVideos] = useState<F1VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    Promise.all([
      getF1News(query).catch(() => []),
      getF1Videos(query).catch(() => [])
    ]).then(([newsData, videosData]) => {
      setNews(newsData);
      setVideos(videosData);
      setLoading(false);
    });
  }, [query]);

  return (
    <div className="w-full max-w-[1920px] mx-auto animate-in fade-in duration-500 space-y-8">
      <header className="flex flex-col gap-2 border-b border-[var(--color-border-subtle)] pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Search className="w-8 h-8 text-[var(--color-f1-red)]" />
          Search Results
        </h1>
        <p className="text-gray-400">
          Showing results for <span className="text-white font-bold">&quot;{query}&quot;</span>
        </p>
      </header>

      {!query ? (
        <div className="p-16 text-center text-gray-500 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
          Please enter a search term above.
        </div>
      ) : loading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-f1-red)]" />
        </div>
      ) : (
        <div className="space-y-12">
          {/* News Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 border-l-4 border-[var(--color-f1-red)] pl-3">News</h2>
            {news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {news.slice(0, 4).map(article => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No news found for &quot;{query}&quot;.</p>
            )}
          </section>

          {/* Videos Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 border-l-4 border-[var(--color-f1-red)] pl-3">Videos</h2>
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.slice(0, 4).map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No videos found for &quot;{query}&quot;.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-16"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-f1-red)]" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
