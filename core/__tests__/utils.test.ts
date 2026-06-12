import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBookmarkPath } from '../utils';

describe('utils', () => {
  describe('getBookmarkPath', () => {
    beforeEach(() => {
      vi.stubGlobal('chrome', {
        bookmarks: {
          get: vi.fn(),
        },
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return bookmark path', async () => {
      const mockGet = vi.fn()
        .mockImplementationOnce((_id, callback) => {
          callback([{ id: '1', title: 'My Bookmark', parentId: '2' }]);
        })
        .mockImplementationOnce((_id, callback) => {
          callback([{ id: '2', title: 'Bookmarks Bar', parentId: '0' }]);
        });

      vi.stubGlobal('chrome', {
        bookmarks: { get: mockGet },
      });

      const path = await getBookmarkPath('1');
      expect(path).toBe('Bookmarks Bar > My Bookmark');
    });

    it('should filter out default folder names', async () => {
      const mockGet = vi.fn()
        .mockImplementationOnce((_id, callback) => {
          callback([{ id: '1', title: 'Test', parentId: '2' }]);
        })
        .mockImplementationOnce((_id, callback) => {
          callback([{ id: '2', title: '书签栏', parentId: '0' }]);
        });

      vi.stubGlobal('chrome', {
        bookmarks: { get: mockGet },
      });

      const path = await getBookmarkPath('1');
      expect(path).toBe('Test');
    });

    it('should return empty string for non-existent bookmark', async () => {
      const mockGet = vi.fn((_id, callback) => {
        callback([]);
      });

      vi.stubGlobal('chrome', {
        bookmarks: { get: mockGet },
      });

      const path = await getBookmarkPath('999');
      expect(path).toBe('');
    });
  });
});
