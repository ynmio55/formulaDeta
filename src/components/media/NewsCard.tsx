import { F1NewsItem } from "@/services/newsService";
import { ExternalLink, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";

export function NewsCard({ article }: { article: F1NewsItem }) {
  return (
    <a 
      href={article.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group flex flex-col bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden hover:border-[var(--color-border-hover)] transition-all h-full"
    >
      <div className="relative aspect-video bg-[var(--color-surface-2)] overflow-hidden">
        {article.imageUrl ? (
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-2xl tracking-widest opacity-20">
            F1 NEWS
          </div>
        )}
        <div className="absolute top-3 right-3 bg-[var(--color-f1-red)] text-white text-xs font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
          {article.source}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {format(new Date(article.publishedAt), "MMM d, yyyy")}</span>
          <span className="flex items-center gap-1"><Tag className="w-3 h-3"/> {article.category}</span>
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-[var(--color-f1-red-hover)] transition-colors">
          {article.title}
        </h3>
        
        <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-1">
          {article.description}
        </p>
        
        <div className="mt-auto flex items-center gap-1 text-[var(--color-f1-red)] text-sm font-semibold group-hover:gap-2 transition-all">
          Read Article <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </div>
    </a>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="flex flex-col bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden h-full animate-pulse">
      <div className="aspect-video bg-[var(--color-surface-2)]"></div>
      <div className="p-5 flex flex-col flex-1">
        <div className="h-3 w-1/3 bg-[var(--color-surface-3)] rounded mb-4"></div>
        <div className="h-6 w-full bg-[var(--color-surface-2)] rounded mb-2"></div>
        <div className="h-6 w-3/4 bg-[var(--color-surface-2)] rounded mb-4"></div>
        <div className="h-4 w-full bg-[var(--color-surface-3)] rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-[var(--color-surface-3)] rounded mb-4"></div>
        <div className="mt-auto h-4 w-24 bg-[var(--color-surface-2)] rounded"></div>
      </div>
    </div>
  );
}
