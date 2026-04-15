'use strict';

/**
 * Tests for HTTP utility helpers.
 */

const { buildQuery, resolveFetch } = require('../src/utils/http');

describe('buildQuery', () => {
  it('returns empty string for empty params', () => {
    expect(buildQuery({})).toBe('');
  });

  it('builds a simple query string', () => {
    const qs = buildQuery({ q: 'chair', page: 1 });
    expect(qs).toContain('q=chair');
    expect(qs).toContain('page=1');
    expect(qs.startsWith('?')).toBe(true);
  });

  it('omits null values', () => {
    const qs = buildQuery({ q: 'chair', category: null, page: 1 });
    expect(qs).not.toContain('category');
  });

  it('omits undefined values', () => {
    const qs = buildQuery({ q: 'chair', tag: undefined });
    expect(qs).not.toContain('tag');
  });

  it('omits empty string values', () => {
    const qs = buildQuery({ q: '', page: 2 });
    expect(qs).not.toContain('q=');
    expect(qs).toContain('page=2');
  });

  it('encodes special characters', () => {
    const qs = buildQuery({ q: 'hello world' });
    expect(qs).toContain('hello+world');
  });
});

describe('resolveFetch', () => {
  it('returns provided fetchFn when given', () => {
    const myFetch = jest.fn();
    expect(resolveFetch(myFetch)).toBe(myFetch);
  });

  it('returns globalThis.fetch when available and no override provided', () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch;

    try {
      const resolved = resolveFetch(undefined);
      expect(typeof resolved).toBe('function');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('throws when no fetch is available', () => {
    const originalFetch = globalThis.fetch;
    delete globalThis.fetch;

    try {
      expect(() => resolveFetch(undefined)).toThrow();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
