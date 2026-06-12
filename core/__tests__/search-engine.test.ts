import { describe, it, expect } from 'vitest';
import { detectQueryType, rerank } from '../search-engine';

describe('SearchEngine', () => {
  describe('detectQueryType', () => {
    it('should detect keyword query (1-2 words)', () => {
      expect(detectQueryType('github')).toBe('keyword');
      expect(detectQueryType('react tutorial')).toBe('keyword');
    });

    it('should detect semantic query (4+ words or with punctuation)', () => {
      expect(detectQueryType('how to build a web application')).toBe('semantic');
      expect(detectQueryType('什么是机器学习？')).toBe('semantic');
      expect(detectQueryType('hello, world!')).toBe('semantic');
    });

    it('should detect mixed query (3 words)', () => {
      expect(detectQueryType('react hooks tutorial')).toBe('mixed');
      expect(detectQueryType('javascript async await')).toBe('mixed');
    });
  });

  describe('rerank', () => {
    const mockHits = [
      {
        id: '1',
        score: 0.5,
        document: {
          id: '1',
          title: 'GitHub',
          url: 'https://github.com',
          text: 'github',
          embedding: [],
          dateLastUsed: Date.now() - 1000 * 60 * 60, // 1 hour ago
        },
      },
      {
        id: '2',
        score: 0.6,
        document: {
          id: '2',
          title: 'React Documentation',
          url: 'https://react.dev',
          text: 'react documentation',
          embedding: [],
          dateLastUsed: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
        },
      },
      {
        id: '3',
        score: 0.4,
        document: {
          id: '3',
          title: 'GitHub Repositories',
          url: 'https://github.com/repos',
          text: 'github repositories',
          embedding: [],
        },
      },
    ];

    it('should boost exact title match', () => {
      const query = 'github';
      const reranked = rerank(mockHits, query);
      expect(reranked[0]!.id).toBe('1');
    });

    it('should boost title starting with query', () => {
      const hits = [
        {
          id: '1',
          score: 0.3,
          document: {
            id: '1',
            title: 'GitHub Clone Guide',
            url: 'https://example.com',
            text: 'github clone guide',
            embedding: [],
          },
        },
        {
          id: '2',
          score: 0.5,
          document: {
            id: '2',
            title: 'Using GitHub',
            url: 'https://example.com',
            text: 'using github',
            embedding: [],
          },
        },
      ];
      const reranked = rerank(hits, 'github clone');
      expect(reranked[0]!.id).toBe('1');
    });

    it('should boost recent usage', () => {
      const now = Date.now();
      const hits = [
        {
          id: '1',
          score: 0.5,
          document: {
            id: '1',
            title: 'Old Document',
            url: 'https://example.com',
            text: 'old document',
            embedding: [],
            dateLastUsed: now - 1000 * 60 * 60 * 24 * 30, // 30 days ago
          },
        },
        {
          id: '2',
          score: 0.5,
          document: {
            id: '2',
            title: 'New Document',
            url: 'https://example.com',
            text: 'new document',
            embedding: [],
            dateLastUsed: now - 1000 * 60 * 60, // 1 hour ago
          },
        },
      ];
      const reranked = rerank(hits, 'document');
      expect(reranked[0]!.id).toBe('2');
    });

    it('should sort by score descending', () => {
      const hits = [
        { id: '1', score: 0.3, document: { id: '1', title: 'A', url: '', text: '', embedding: [] } },
        { id: '2', score: 0.7, document: { id: '2', title: 'B', url: '', text: '', embedding: [] } },
        { id: '3', score: 0.5, document: { id: '3', title: 'C', url: '', text: '', embedding: [] } },
      ];
      const reranked = rerank(hits, 'test');
      expect(reranked.map((h) => h!.id)).toEqual(['2', '3', '1']);
    });
  });
});
