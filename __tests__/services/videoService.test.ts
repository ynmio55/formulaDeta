import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getF1Videos } from '../../src/services/videoService';

vi.mock('next/cache', () => ({
  unstable_cache: (cb: any) => cb
}));

describe('videoService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.YOUTUBE_API_KEY;
  });

  it('should fallback to RSS if YOUTUBE_API_KEY is not set', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await getF1Videos();
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('YouTube API failed or missing key, falling back to RSS:'),
      expect.any(Error)
    );
    
    consoleWarnSpy.mockRestore();
  });
});
