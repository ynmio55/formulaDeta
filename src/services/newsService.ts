"use server";

import Parser from 'rss-parser';
import { unstable_cache } from 'next/cache';

const parser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'thumbnail'],
      ['media:content', 'mediaContent'],
      ['enclosure', 'enclosure']
    ]
  }
});

export interface F1NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  url: string;
  imageUrl: string | null;
  category: string;
}

const F1_RSS_FEEDS = [
  'https://www.motorsport.com/rss/f1/news/',
  'https://feeds.bbci.co.uk/sport/formula1/rss.xml'
];

async function fetchRssFallback(query?: string): Promise<F1NewsItem[]> {
  try {
    const feedPromises = F1_RSS_FEEDS.map(url => parser.parseURL(url).catch(() => null));
    const feeds = await Promise.all(feedPromises);
    
    let allItems: F1NewsItem[] = [];
    
    feeds.forEach(feed => {
      if (!feed) return;
      const source = feed.title || 'F1 News';
      
      feed.items.forEach(item => {
        let imageUrl = null;
        if (item.enclosure && item.enclosure.url) {
          imageUrl = item.enclosure.url;
        } else if (item.thumbnail && item.thumbnail.$ && item.thumbnail.$.url) {
          imageUrl = item.thumbnail.$.url;
        } else if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
          imageUrl = item.mediaContent.$.url;
        }
        
        allItems.push({
          id: item.guid || item.link || Math.random().toString(),
          title: item.title || 'No Title',
          description: item.contentSnippet || item.content || '',
          source: source,
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          url: item.link || '#',
          imageUrl: imageUrl,
          category: 'News'
        });
      });
    });

    // Sort by newest
    allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Filter by query if provided
    if (query) {
      const lowerQuery = query.toLowerCase();
      allItems = allItems.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) || 
        item.description.toLowerCase().includes(lowerQuery)
      );
    }

    return allItems;
  } catch (error) {
    console.error("RSS Fallback failed", error);
    return [];
  }
}

async function fetchFromNewsAPI(query: string = 'Formula 1'): Promise<F1NewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('No NEWS_API_KEY provided');
  }

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&apiKey=${apiKey}`;
  const response = await fetch(url, { next: { revalidate: 900 } }); // 15 mins cache
  
  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.articles) return [];

  return data.articles.map((article: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const source = article.source as Record<string, any>;
    return {
      id: (article.url as string),
      title: (article.title as string),
      description: (article.description as string),
      source: source.name,
      publishedAt: (article.publishedAt as string),
      url: (article.url as string),
      imageUrl: (article.urlToImage as string) || null,
      category: 'News'
    };
  });
}

export async function getF1News(query?: string): Promise<F1NewsItem[]> {
  try {
    if (process.env.NEWS_API_KEY) {
      return await fetchFromNewsAPI(query || 'Formula 1');
    }
    throw new Error('No API Key');
  } catch (error) {
    console.warn("NewsAPI failed or missing key, falling back to RSS:", error);
    return await fetchRssFallback(query);
  }
}
