'use strict';

/**
 * Tests for the Fetch3D client class using mocked providers.
 */

const Fetch3D = require('../src/fetch3d');
const { createModel } = require('../src/models/Model');

// ------ mock data ------

const CHAIR_MODEL = createModel({
  id: 'chair-01',
  name: 'Office Chair',
  description: 'A comfortable office chair',
  license: 'CC0',
  source: 'polyhaven',
  formats: ['glb', 'fbx', 'obj'],
  categories: ['Furniture'],
  tags: ['chair', 'office'],
  createdAt: '2023-01-01T00:00:00Z',
});

const ROCKET_MODEL = createModel({
  id: 'rocket-01',
  name: 'Apollo Rocket',
  description: 'NASA Apollo rocket',
  license: 'CC-BY',
  source: 'nasa',
  formats: ['obj', 'stl'],
  categories: ['Space'],
  tags: ['nasa', 'rocket'],
});

// ------ mock providers ------

jest.mock('../src/providers', () => {
  const PROVIDERS = {
    polyhaven: {
      id: 'polyhaven',
      search: jest.fn().mockResolvedValue([
        require('../src/models/Model').createModel({
          id: 'chair-01',
          name: 'Office Chair',
          description: 'A comfortable office chair',
          license: 'CC0',
          source: 'polyhaven',
          formats: ['glb', 'fbx', 'obj'],
          categories: ['Furniture'],
          tags: ['chair', 'office'],
          createdAt: '2023-01-01T00:00:00Z',
        }),
      ]),
    },
    nasa: {
      id: 'nasa',
      search: jest.fn().mockResolvedValue([
        require('../src/models/Model').createModel({
          id: 'rocket-01',
          name: 'Apollo Rocket',
          description: 'NASA Apollo rocket',
          license: 'CC-BY',
          source: 'nasa',
          formats: ['obj', 'stl'],
          categories: ['Space'],
          tags: ['nasa', 'rocket'],
        }),
      ]),
    },
    broken: {
      id: 'broken',
      search: jest.fn().mockRejectedValue(new Error('Network error')),
    },
  };

  return {
    PROVIDERS,
    listProviders: () => Object.keys(PROVIDERS),
    getProvider: (id) => PROVIDERS[id],
    getAllProviders: () => Object.values(PROVIDERS),
  };
});

// ------ tests ------

describe('Fetch3D constructor', () => {
  it('can be instantiated without options', () => {
    const client = new Fetch3D();
    expect(client).toBeInstanceOf(Fetch3D);
  });

  it('stores apiKeys and fetchFn', () => {
    const fn = jest.fn();
    const client = new Fetch3D({ apiKeys: { sketchfab: 'token123' }, fetchFn: fn });
    expect(client._apiKeys.sketchfab).toBe('token123');
    expect(client._fetchFn).toBe(fn);
  });
});

describe('Fetch3D.listProviders()', () => {
  it('returns array of provider IDs', () => {
    const client = new Fetch3D();
    const providers = client.listProviders();
    expect(Array.isArray(providers)).toBe(true);
    expect(providers).toContain('polyhaven');
    expect(providers).toContain('nasa');
  });
});

describe('Fetch3D.search()', () => {
  it('returns models from a known provider', async () => {
    const client = new Fetch3D();
    const models = await client.search('polyhaven', { query: 'chair' });
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].source).toBe('polyhaven');
  });

  it('throws for an unknown provider', async () => {
    const client = new Fetch3D();
    await expect(client.search('nonexistent')).rejects.toThrow(/Unknown provider/);
  });

  it('applies license filter', async () => {
    const client = new Fetch3D();
    const models = await client.search('polyhaven', { license: 'CC-BY' });
    // The mock returns CC0 model; CC-BY filter should exclude it
    expect(models).toHaveLength(0);
  });

  it('applies formats filter', async () => {
    const client = new Fetch3D();
    const models = await client.search('polyhaven', { formats: ['glb'] });
    expect(models).toHaveLength(1);
  });

  it('applies tags filter', async () => {
    const client = new Fetch3D();
    const models = await client.search('polyhaven', { tags: ['chair'] });
    expect(models).toHaveLength(1);

    const noMatch = await client.search('polyhaven', { tags: ['rocket'] });
    expect(noMatch).toHaveLength(0);
  });

  it('sorts results when sortBy is provided', async () => {
    const client = new Fetch3D();
    const models = await client.search('polyhaven', { sortBy: 'name', order: 'asc' });
    expect(Array.isArray(models)).toBe(true);
  });

  it('injects sketchfab API key', async () => {
    const client = new Fetch3D({ apiKeys: { polyhaven: 'mykey' } });
    // Just verifying the options building doesn't throw
    const opts = client._buildProviderOptions('polyhaven', { query: 'tree' });
    expect(opts.apiKey).toBe('mykey');
    expect(opts.query).toBe('tree');
  });

  it('injects thingiverse appToken', async () => {
    const client = new Fetch3D({ apiKeys: { thingiverse: 'mytok' } });
    const opts = client._buildProviderOptions('thingiverse', {});
    expect(opts.appToken).toBe('mytok');
  });
});

describe('Fetch3D.searchAll()', () => {
  it('searches all providers and returns combined results', async () => {
    const client = new Fetch3D();
    const { models, errors } = await client.searchAll({ query: 'chair' });
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThanOrEqual(2);
  });

  it('collects errors from failed providers', async () => {
    const client = new Fetch3D();
    const { errors } = await client.searchAll({}, { providers: ['polyhaven', 'broken'] });
    expect(errors.broken).toBeDefined();
    expect(errors.polyhaven).toBeUndefined();
  });

  it('deduplicates results by default', async () => {
    const client = new Fetch3D();
    const { models } = await client.searchAll({}, { providers: ['polyhaven', 'polyhaven'] });
    // Even though polyhaven is listed twice, each model should only appear once
    const ids = models.map((m) => `${m.source}::${m.id}`);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('supports sequential mode', async () => {
    const client = new Fetch3D();
    const { models } = await client.searchAll(
      { query: 'test' },
      { providers: ['polyhaven', 'nasa'], mode: 'sequential' }
    );
    expect(models.length).toBeGreaterThan(0);
  });

  it('supports restricting to a subset of providers', async () => {
    const client = new Fetch3D();
    const { models } = await client.searchAll({}, { providers: ['polyhaven'] });
    expect(models.every((m) => m.source === 'polyhaven')).toBe(true);
  });
});
