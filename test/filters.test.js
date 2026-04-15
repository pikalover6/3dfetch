'use strict';

/**
 * Tests for filter utilities.
 */

const { applyFilters, deduplicateModels, sortModels } = require('../src/utils/filters');
const { createModel } = require('../src/models/Model');

function makeModel(overrides) {
  return createModel({ id: '1', name: 'Test', source: 'test', ...overrides });
}

const CHAIR = makeModel({
  id: '1',
  name: 'Wooden Chair',
  description: 'A nice wooden chair for your home',
  license: 'CC0',
  source: 'polyhaven',
  formats: ['glb', 'fbx'],
  categories: ['Furniture'],
  tags: ['chair', 'wooden', 'home'],
});

const SPACESHIP = makeModel({
  id: '2',
  name: 'Apollo Rocket',
  description: 'NASA Apollo rocket model',
  license: 'CC-BY',
  source: 'nasa',
  formats: ['obj', 'stl'],
  categories: ['Space', 'Vehicles'],
  tags: ['nasa', 'rocket', 'space'],
});

const TREE = makeModel({
  id: '3',
  name: 'Oak Tree',
  description: 'Realistic oak tree',
  license: 'CC0',
  source: 'polyhaven',
  formats: ['blend', 'fbx'],
  categories: ['Nature', 'Plants'],
  tags: ['tree', 'nature', 'outdoor'],
  createdAt: '2023-03-01T00:00:00Z',
});

const MODELS = [CHAIR, SPACESHIP, TREE];

describe('applyFilters', () => {
  it('returns all models when no filters are provided', () => {
    expect(applyFilters(MODELS)).toHaveLength(3);
    expect(applyFilters(MODELS, {})).toHaveLength(3);
  });

  it('filters by source', () => {
    const result = applyFilters(MODELS, { source: 'polyhaven' });
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.source === 'polyhaven')).toBe(true);
  });

  it('filters by license keyword (case-insensitive)', () => {
    const result = applyFilters(MODELS, { license: 'cc0' });
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.license === 'CC0')).toBe(true);
  });

  it('filters by formats (model must have at least one)', () => {
    const result = applyFilters(MODELS, { formats: ['obj'] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Apollo Rocket');
  });

  it('filters by formats — matches multiple', () => {
    const result = applyFilters(MODELS, { formats: ['fbx'] });
    expect(result).toHaveLength(2);
  });

  it('filters by categories (at least one match)', () => {
    const result = applyFilters(MODELS, { categories: ['Nature'] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Oak Tree');
  });

  it('filters by tags (at least one match)', () => {
    const result = applyFilters(MODELS, { tags: ['rocket'] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Apollo Rocket');
  });

  it('filters by query (matches name, description, tags, categories)', () => {
    const result = applyFilters(MODELS, { query: 'wooden' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Wooden Chair');
  });

  it('combines multiple filters (AND logic)', () => {
    const result = applyFilters(MODELS, { source: 'polyhaven', formats: ['fbx'] });
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no models match', () => {
    const result = applyFilters(MODELS, { license: 'MIT' });
    expect(result).toHaveLength(0);
  });
});

describe('deduplicateModels', () => {
  it('removes duplicate models by source+id', () => {
    const dup = makeModel({ id: '1', source: 'polyhaven' });
    const unique = makeModel({ id: '2', source: 'polyhaven' });
    const result = deduplicateModels([CHAIR, dup, unique]);
    expect(result).toHaveLength(2);
  });

  it('keeps models with same id but different source', () => {
    const sameIdDiffSource = makeModel({ id: '1', source: 'nasa' });
    const result = deduplicateModels([CHAIR, sameIdDiffSource]);
    expect(result).toHaveLength(2);
  });

  it('handles empty array', () => {
    expect(deduplicateModels([])).toEqual([]);
  });
});

describe('sortModels', () => {
  it('sorts by name ascending by default', () => {
    const result = sortModels(MODELS);
    expect(result[0].name).toBe('Apollo Rocket');
    expect(result[1].name).toBe('Oak Tree');
    expect(result[2].name).toBe('Wooden Chair');
  });

  it('sorts by name descending', () => {
    const result = sortModels(MODELS, 'name', 'desc');
    expect(result[0].name).toBe('Wooden Chair');
  });

  it('sorts by createdAt', () => {
    const withDates = [
      makeModel({ id: 'a', name: 'A', createdAt: '2023-06-01T00:00:00Z' }),
      makeModel({ id: 'b', name: 'B', createdAt: '2022-01-01T00:00:00Z' }),
      makeModel({ id: 'c', name: 'C', createdAt: '2024-01-01T00:00:00Z' }),
    ];
    const result = sortModels(withDates, 'createdAt', 'asc');
    expect(result[0].id).toBe('b');
    expect(result[2].id).toBe('c');
  });

  it('does not mutate original array', () => {
    const original = [...MODELS];
    sortModels(MODELS, 'name', 'desc');
    expect(MODELS[0].name).toBe(original[0].name);
  });
});
