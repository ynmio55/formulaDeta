import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getF1News } from '../../src/services/newsService';
import Parser from 'rss-parser';

// Mock unstable_cache to just execute the function
vi.mock('next/cache', () => ({
  unstable_cache: (cb: any) => cb
}));

describe('newsService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.NEWS_API_KEY;
  });

  it('should fallback to RSS if NEWS_API_KEY is not set', async () => {
    // If no key is set, it falls back to RSS. We don't want to actually hit the network in unit tests,
    // but the RSS parser will try. Let's spy on console.warn to verify fallback logic triggered.
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // We expect it to try RSS. Since we aren't mocking fetch for RSS (rss-parser uses http), 
    // it might succeed or fail depending on network, but it should definitely warn.
    await getF1News();
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('NewsAPI failed or missing key, falling back to RSS:'),
      expect.any(Error)
    );
    
    consoleWarnSpy.mockRestore();
  });
});
