import { describe, it, expect } from 'vitest';
import { detectQueryType } from '../search-engine';

describe('SearchEngine', () => {
  describe('detectQueryType', () => {
    it('should detect keyword query (1 word English)', () => {
      expect(detectQueryType('github')).toBe('keyword');
      expect(detectQueryType('python')).toBe('keyword');
    });

    it('should detect keyword query (short Chinese)', () => {
      expect(detectQueryType('编程')).toBe('keyword');
      expect(detectQueryType('支付系统')).toBe('keyword');
    });

    it('should detect semantic query (4+ English words)', () => {
      expect(detectQueryType('how to build a web application')).toBe('semantic');
    });

    it('should detect semantic query (Chinese 5+ chars)', () => {
      expect(detectQueryType('什么是机器学习？')).toBe('semantic');
    });

    it('should detect mixed query (Chinese-English mixed)', () => {
      expect(detectQueryType('react教程')).toBe('mixed');
      expect(detectQueryType('如何配置Python开发环境')).toBe('mixed');
    });

    it('should detect mixed query (2-4 English words)', () => {
      expect(detectQueryType('react tutorial')).toBe('mixed');
      expect(detectQueryType('react hooks tutorial')).toBe('mixed');
      expect(detectQueryType('javascript async await')).toBe('mixed');
    });
  });
});
