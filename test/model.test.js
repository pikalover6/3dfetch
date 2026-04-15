'use strict';

/**
 * Tests for the core Model schema factory.
 */

const { createModel } = require('../src/models/Model');

describe('createModel', () => {
  it('returns a complete model with all required fields', () => {
    const model = createModel({
      id: 'test-1',
      name: 'Test Chair',
      source: 'polyhaven',
    });

    expect(model.id).toBe('test-1');
    expect(model.name).toBe('Test Chair');
    expect(model.source).toBe('polyhaven');
    expect(model.description).toBe('');
    expect(model.license).toBe('Unknown');
    expect(model.sourceUrl).toBe('');
    expect(model.downloadUrl).toBeNull();
    expect(model.thumbnailUrl).toBeNull();
    expect(Array.isArray(model.formats)).toBe(true);
    expect(Array.isArray(model.categories)).toBe(true);
    expect(Array.isArray(model.tags)).toBe(true);
    expect(model.createdAt).toBeNull();
    expect(model.updatedAt).toBeNull();
    expect(typeof model.metadata).toBe('object');
  });

  it('preserves all provided fields', () => {
    const input = {
      id: 'abc',
      name: 'Spaceship',
      description: 'A cool spaceship',
      author: { id: 'u1', name: 'NASA', url: 'https://nasa.gov' },
      license: 'CC0',
      source: 'nasa',
      sourceUrl: 'https://nasa3d.arc.nasa.gov/detail/spaceship',
      downloadUrl: 'https://nasa3d.arc.nasa.gov/download/spaceship',
      thumbnailUrl: 'https://example.com/thumb.png',
      formats: ['obj', 'stl'],
      categories: ['Space', 'Vehicles'],
      tags: ['nasa', 'spacecraft'],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-06-01T00:00:00Z',
      metadata: { mission: 'Apollo' },
    };
    const model = createModel(input);

    expect(model.id).toBe('abc');
    expect(model.author.name).toBe('NASA');
    expect(model.license).toBe('CC0');
    expect(model.formats).toEqual(['obj', 'stl']);
    expect(model.categories).toEqual(['Space', 'Vehicles']);
    expect(model.tags).toEqual(['nasa', 'spacecraft']);
    expect(model.metadata.mission).toBe('Apollo');
  });

  it('handles missing author gracefully', () => {
    const model = createModel({ id: '1', name: 'Thing', source: 'test' });
    expect(model.author.id).toBeNull();
    expect(model.author.name).toBe('');
    expect(model.author.url).toBeNull();
  });

  it('ensures formats/categories/tags are always arrays', () => {
    const model = createModel({ id: '1', name: 'X', formats: null });
    expect(Array.isArray(model.formats)).toBe(true);
    expect(model.formats).toHaveLength(0);
  });
});
