"use client";

import { getF1Videos, F1VideoItem } from "@/services/videoService";
import { VideoCard, VideoCardSkeleton } from "@/components/media/VideoCard";
import { useEffect, useState } from "react";
import { Video } from "lucide-react";

export default function VideoPage() {
  const [videos, setVideos] = useState<F1VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVideos() {
      try {
        const data = await getF1Videos();
        setVideos(data);
      } catch (err) {
        setError("Failed to load videos");
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, []);

  return (
    <div className="w-full max-w-[1920px] mx-auto animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col gap-2 border-b border-[var(--color-border-subtle)] pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Video className="w-8 h-8 text-[var(--color-f1-red)]" />
          F1 Video Center
        </h1>
        <p className="text-gray-400">Race highlights, Team Radio, and Onboards.</p>
      </header>

      {error && (
        <div className="p-8 text-center text-[var(--color-f1-red)] bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center text-gray-500 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border-subtle)]">
          ยังไม่มีวิดีโอ (No videos available at the moment)
        </div>
      )}
    </div>
  );
}
