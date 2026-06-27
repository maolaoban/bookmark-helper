import { describe, it, expect } from 'vitest';
import { buildEmbeddingText, buildEnrichedText } from '../text-preprocessor';

describe('TextPreprocessor', () => {
  describe('buildEmbeddingText', () => {
    it('should build embedding text from title and url', () => {
      const result = buildEmbeddingText('How to Cook Pasta', 'https://www.example.com/recipes/italian/pasta-guide.html');
      expect(result).toBe('how to cook pasta example.com recipes italian pasta guide html');
    });

    it('should handle url without www', () => {
      const result = buildEmbeddingText('Test Title', 'https://example.com/path');
      expect(result).toBe('test title example.com path');
    });

    it('should filter out numeric segments', () => {
      const result = buildEmbeddingText('Title', 'https://example.com/123/abc/456');
      expect(result).toBe('title example.com abc');
    });

    it('should truncate to 512 chars', () => {
      const longTitle = 'A'.repeat(600);
      const result = buildEmbeddingText(longTitle, 'https://example.com');
      expect(result.length).toBeLessThanOrEqual(512);
    });
  });

  describe('buildEnrichedText', () => {
    it('should include description and body text', () => {
      const result = buildEnrichedText('Title', 'https://example.com', 'A description', 'Some body text');
      expect(result).toContain('title');
      expect(result).toContain('A description');
      expect(result).toContain('Some body text');
    });

    it('should handle empty description and body', () => {
      const result = buildEnrichedText('Title', 'https://example.com', '', '');
      expect(result).toBe('title example.com');
    });

    it('should include header and footer text', () => {
      const result = buildEnrichedText('Title', 'https://example.com', 'A description', 'Some body', 'Nav menu', 'Copyright 2024');
      expect(result).toContain('Nav menu');
      expect(result).toContain('A description');
      expect(result).toContain('Some body');
      expect(result).toContain('Copyright 2024');
    });

    it('should handle optional header and footer', () => {
      const result = buildEnrichedText('Title', 'https://example.com', 'Desc', 'Body');
      expect(result).toBe('title example.com Desc Body');
    });

    it('should truncate with header and footer within 512 chars', () => {
      const longHeader = 'H'.repeat(300);
      const longFooter = 'F'.repeat(300);
      const result = buildEnrichedText('Title', 'https://example.com', '', '', longHeader, longFooter);
      expect(result.length).toBeLessThanOrEqual(512);
    });
  });
});
