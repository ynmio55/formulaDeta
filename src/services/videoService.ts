"use server";

import Parser from 'rss-parser';
import { unstable_cache } from 'next/cache';

const parser = new Parser({
  customFields: {
    item: [
      ['media:group', 'mediaGroup'],
    ]
  }
});

export interface F1VideoItem {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
}

const F1_YOUTUBE_CHANNEL_ID = 'UCB_qr75-ydFVKSF9Dmo6izg';
const RSS_FALLBACK_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${F1_YOUTUBE_CHANNEL_ID}`;

async function fetchVideoRssFallback(query?: string): Promise<F1VideoItem[]> {
  try {
    const feed = await parser.parseURL(RSS_FALLBACK_URL);
    let allItems: F1VideoItem[] = [];

    feed.items.forEach(feedItem => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = feedItem as any;
      // Extract thumbnail from media:group if available
      let thumbnailUrl = `https://i.ytimg.com/vi/${item.id.replace('yt:video:', '')}/hqdefault.jpg`;
      
      if (item.mediaGroup && item.mediaGroup['media:thumbnail'] && item.mediaGroup['media:thumbnail'][0] && item.mediaGroup['media:thumbnail'][0].$) {
         thumbnailUrl = item.mediaGroup['media:thumbnail'][0].$.url;
      }

      allItems.push({
        id: item.id.replace('yt:video:', ''),
        title: item.title || 'No Title',
        description: item.mediaGroup?.['media:description']?.[0] || '',
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        channelTitle: feed.title || 'FORMULA 1',
        thumbnailUrl: thumbnailUrl,
        videoUrl: item.link || `https://www.youtube.com/watch?v=${item.id.replace('yt:video:', '')}`
      });
    });

    if (query) {
      const lowerQuery = query.toLowerCase();
      allItems = allItems.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) || 
        item.description.toLowerCase().includes(lowerQuery)
      );
    }

    return allItems;
  } catch (error) {
    console.error("Video RSS Fallback failed", error);
    return [];
  }
}

async function fetchFromYouTubeAPI(query: string = 'Formula 1'): Promise<F1VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('No YOUTUBE_API_KEY provided');
  }

  // Use search endpoint
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&order=date&key=${apiKey}`;
  const response = await fetch(url, { next: { revalidate: 1800 } }); // 30 mins cache
  
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.items) return [];

  return data.items.map((item: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snippet = item.snippet as Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = item.id as Record<string, any>;
    return {
      id: id.videoId,
      title: snippet.title,
      description: snippet.description,
      publishedAt: snippet.publishedAt,
      channelTitle: snippet.channelTitle,
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      videoUrl: `https://www.youtube.com/watch?v=${id.videoId}`
    };
  });
}

export async function getF1Videos(query?: string): Promise<F1VideoItem[]> {
  try {
    if (process.env.YOUTUBE_API_KEY) {
      return await fetchFromYouTubeAPI(query || 'Formula 1 highlights');
    }
    throw new Error('No API Key');
  } catch (error) {
    console.warn("YouTube API failed or missing key, falling back to RSS:", error);
    return await fetchVideoRssFallback(query);
  }
}
