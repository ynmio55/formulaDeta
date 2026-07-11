"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-500" />
      </div>
      <input
        type="search"
        placeholder="Search drivers, teams, news, videos..."
        className="block w-full pl-10 pr-3 py-2 border border-[var(--color-border-subtle)] rounded-lg leading-5 bg-[var(--color-surface-1)] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--color-f1-red)] focus:border-[var(--color-f1-red)] sm:text-sm transition-colors"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}
