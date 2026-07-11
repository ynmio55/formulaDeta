import { F1VideoItem } from "@/services/videoService";
import { Play, Calendar, Video } from "lucide-react";
import { format } from "date-fns";

export function VideoCard({ video }: { video: F1VideoItem }) {
  return (
    <a 
      href={video.videoUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group flex flex-col bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden hover:border-[var(--color-border-hover)] transition-all h-full"
    >
      <div className="relative aspect-video bg-[#000] overflow-hidden">
        {video.thumbnailUrl && (
          <img 
            src={video.thumbnailUrl} 
            alt={video.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-[#FF0000] transition-colors border border-white/20 group-hover:border-transparent">
            <Play className="w-5 h-5 text-white ml-1" fill="currentColor" />
          </div>
        </div>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase flex items-center gap-1">
          <Video className="w-3 h-3 text-[#FF0000]"/> {video.channelTitle}
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 group-hover:text-[var(--color-f1-red-hover)] transition-colors">
          {video.title}
        </h3>
        <div className="mt-auto flex items-center gap-2 text-xs text-gray-500 pt-2">
          <Calendar className="w-3 h-3"/> {format(new Date(video.publishedAt), "MMM d, yyyy")}
        </div>
      </div>
    </a>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden h-full animate-pulse">
      <div className="aspect-video bg-[var(--color-surface-2)]"></div>
      <div className="p-4 flex flex-col flex-1">
        <div className="h-4 w-full bg-[var(--color-surface-2)] rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-[var(--color-surface-2)] rounded mb-4"></div>
        <div className="mt-auto h-3 w-1/3 bg-[var(--color-surface-3)] rounded"></div>
      </div>
    </div>
  );
}
