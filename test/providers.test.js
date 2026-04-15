'use strict';

/**
 * Tests for each individual provider's normalise / search logic using
 * mocked HTTP responses. This ensures the transformation code is correct
 * without making real network requests.
 */

// We mock the http module globally so every provider uses fake data.
jest.mock('../src/utils/http', () => ({
  getJSON: jest.fn(),
  postJSON: jest.fn(),
  buildQuery: jest.requireActual('../src/utils/http').buildQuery,
  resolveFetch: jest.requireActual('../src/utils/http').resolveFetch,
}));

const { getJSON, postJSON } = require('../src/utils/http');

// ---- PolyHaven ----
describe('PolyHaven provider', () => {
  const provider = require('../src/providers/polyhaven');

  beforeEach(() => {
    getJSON.mockResolvedValue({
      'wooden_chair': {
        name: 'Wooden Chair',
        authors: { 'artist1': {} },
        categories: ['furniture'],
        tags: ['chair', 'wooden'],
        date_published: 1672531200,
        type: 2,
      },
    });
  });

  it('search returns normalised models', async () => {
    const results = await provider.search({ query: 'chair' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('wooden_chair');
    expect(m.name).toBe('Wooden Chair');
    expect(m.source).toBe('polyhaven');
    expect(m.license).toBe('CC0');
    expect(m.formats).toContain('gltf');
    expect(m.tags).toContain('chair');
  });

  it('filters by query client-side', async () => {
    const results = await provider.search({ query: 'rocket' });
    expect(results).toHaveLength(0);
  });
});

// ---- Sketchfab ----
describe('Sketchfab provider', () => {
  const provider = require('../src/providers/sketchfab');

  beforeEach(() => {
    getJSON.mockResolvedValue({
      results: [
        {
          uid: 'abc123',
          name: 'Cool Robot',
          description: 'A robot model',
          user: { uid: 'u1', displayName: 'Roboto', profileUrl: 'https://sketchfab.com/roboto' },
          license: { slug: 'creative-commons-cc0', label: 'CC0' },
          categories: [{ name: 'Characters' }],
          tags: [{ name: 'robot' }],
          thumbnails: { images: [{ url: 'https://example.com/thumb.jpg', width: 200 }] },
          viewerUrl: 'https://sketchfab.com/models/abc123',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-06-01T00:00:00.000Z',
          archives: {},
          vertexCount: 5000,
          faceCount: 3000,
        },
      ],
    });
  });

  it('search returns normalised models', async () => {
    const results = await provider.search({ query: 'robot' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('abc123');
    expect(m.name).toBe('Cool Robot');
    expect(m.source).toBe('sketchfab');
    expect(m.license).toBe('CC0');
    expect(m.author.name).toBe('Roboto');
    expect(m.categories).toContain('Characters');
    expect(m.tags).toContain('robot');
  });
});

// ---- Thingiverse ----
describe('Thingiverse provider', () => {
  const provider = require('../src/providers/thingiverse');

  it('throws when no appToken is provided', async () => {
    await expect(provider.search({})).rejects.toThrow(/app token/);
  });

  it('search returns normalised models with appToken', async () => {
    getJSON.mockResolvedValue([
      {
        id: 55555,
        name: 'Cable Organiser',
        description: 'Organise your cables',
        creator: { id: 99, name: 'maker', public_url: '/maker' },
        license: 'CC-BY',
        added: '2022-01-01T00:00:00+00:00',
        modified: '2022-06-01T00:00:00+00:00',
      },
    ]);

    const results = await provider.search({ appToken: 'fake', query: 'cable' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('55555');
    expect(m.source).toBe('thingiverse');
    expect(m.formats).toContain('stl');
    expect(m.license).toBe('CC-BY');
  });
});

// ---- MyMiniFactory ----
describe('MyMiniFactory provider', () => {
  const provider = require('../src/providers/myminifactory');

  it('throws when no apiKey is provided', async () => {
    await expect(provider.search({})).rejects.toThrow(/API key/);
  });

  it('search returns normalised models', async () => {
    getJSON.mockResolvedValue({
      items: [
        {
          id: 777,
          name: 'Dragon Head',
          description: 'Epic dragon head',
          designer: { id: 10, name: 'sculptor', profile_url: '/sculptor' },
          license: 'CC-BY',
          published_at: '2022-05-01T00:00:00Z',
          images: { featured: { thumbnail: { url: 'https://example.com/dragon.jpg' } } },
          categories: [{ name: 'Creatures' }],
          tags: [{ name: 'dragon' }],
          free: true,
        },
      ],
    });

    const results = await provider.search({ apiKey: 'fake', query: 'dragon' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('777');
    expect(m.source).toBe('myminifactory');
    expect(m.name).toBe('Dragon Head');
  });
});

// ---- Printables ----
describe('Printables provider', () => {
  const provider = require('../src/providers/printables');

  it('search returns normalised models', async () => {
    postJSON.mockResolvedValue({
      data: {
        prints: {
          items: [
            {
              id: '1234',
              name: 'Vase Mode Bowl',
              slug: 'vase-mode-bowl',
              description: 'A beautiful bowl',
              license: { name: 'CC-BY' },
              user: { id: '5', publicUsername: 'ceramist', slug: 'ceramist' },
              datePublish: '2023-04-01T00:00:00Z',
              dateModified: '2023-05-01T00:00:00Z',
              category: { name: 'Home Decor' },
              tags: [{ name: 'vase' }, { name: 'bowl' }],
              image: { filePath: 'models/vase.jpg' },
              downloadCount: 500,
              likesCount: 80,
              stlFileCount: 3,
            },
          ],
          totalCount: 1,
        },
      },
    });

    const results = await provider.search({ query: 'vase' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('1234');
    expect(m.source).toBe('printables');
    expect(m.categories).toContain('Home Decor');
    expect(m.tags).toContain('vase');
    expect(m.author.name).toBe('ceramist');
  });
});

// ---- NASA ----
describe('NASA provider', () => {
  const provider = require('../src/providers/nasa');

  it('search returns normalised models', async () => {
    getJSON.mockResolvedValue({
      items: [
        {
          file_name: 'saturn-v',
          title: 'Saturn V Rocket',
          description: 'Full Saturn V rocket model',
          file_type: 'obj',
          tags: ['rocket', 'saturn', 'apollo'],
          date_added: '2020-07-01',
          type: '3D Model',
          mission: 'Apollo',
        },
      ],
    });

    const results = await provider.search({ query: 'saturn' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('saturn-v');
    expect(m.source).toBe('nasa');
    expect(m.license).toBe('NASA Media License');
    expect(m.author.name).toBe('NASA');
    expect(m.formats).toContain('obj');
  });
});

// ---- AmbientCG ----
describe('AmbientCG provider', () => {
  const provider = require('../src/providers/ambientcg');

  it('search returns normalised models', async () => {
    getJSON.mockResolvedValue({
      foundAssets: [
        {
          assetId: 'Chair001',
          tags: ['chair', 'furniture'],
          category: 'furniture',
          creationDate: '2022-01-01',
          latestUpdateDate: '2023-01-01',
          downloadCount: 1200,
          downloadFolders: {
            default: {
              downloadFiletypes: {
                'glb': { downloadLink: 'https://ambientcg.com/dl/Chair001.glb' },
              },
            },
          },
          previewImage: 'https://ambientcg.com/img/Chair001.jpg',
        },
      ],
    });

    const results = await provider.search({ query: 'chair' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('Chair001');
    expect(m.source).toBe('ambientcg');
    expect(m.license).toBe('CC0');
    expect(m.downloadUrl).toBe('https://ambientcg.com/dl/Chair001.glb');
  });
});

// ---- GrabCAD ----
describe('GrabCAD provider', () => {
  const provider = require('../src/providers/grabcad');

  it('search returns normalised models', async () => {
    getJSON.mockResolvedValue({
      models: [
        {
          id: 42,
          name: 'Gear Assembly',
          slug: 'gear-assembly',
          description: 'A complete gear assembly',
          owner: { id: 7, display_name: 'Engineer Bob', username: 'engineer_bob' },
          cad_files: [{ name: 'assembly.step' }, { name: 'preview.obj' }],
          tag_list: ['gear', 'mechanical'],
          software_list: [{ name: 'SolidWorks' }],
          created_at: '2021-03-15T00:00:00Z',
          like_count: 45,
        },
      ],
    });

    const results = await provider.search({ query: 'gear' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('42');
    expect(m.source).toBe('grabcad');
    expect(m.license).toBe('GrabCAD Community License');
    expect(m.formats).toContain('step');
    expect(m.tags).toContain('gear');
  });
});

// ---- Cults3D ----
describe('Cults3D provider', () => {
  const provider = require('../src/providers/cults3d');

  it('search returns normalised models', async () => {
    postJSON.mockResolvedValue({
      data: {
        searchCreations: {
          creations: [
            {
              id: '9999',
              slug: 'cool-helmet',
              name: 'Cool Helmet',
              description: 'A sci-fi helmet',
              license: { spdxIdentifier: 'CC-BY-4.0', name: 'CC BY 4.0' },
              illustrationImageUrl: 'https://cults3d.com/cool-helmet.jpg',
              creator: { nick: 'designer1' },
              categories: [{ slug: 'armor', name: 'Armor' }],
              tags: ['helmet', 'sci-fi'],
              publishedAt: '2023-02-14T00:00:00Z',
              downloadsCount: 300,
              likesCount: 50,
            },
          ],
          totalCount: 1,
        },
      },
    });

    const results = await provider.search({ query: 'helmet' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('9999');
    expect(m.source).toBe('cults3d');
    expect(m.name).toBe('Cool Helmet');
    expect(m.license).toBe('CC-BY-4.0');
  });
});

// ---- CGTrader ----
describe('CGTrader provider', () => {
  const provider = require('../src/providers/cgtrader');

  it('search returns normalised models', async () => {
    getJSON.mockResolvedValue({
      models: [
        {
          id: 88,
          name: 'Old Book',
          slug: 'old-book',
          description: 'Antique book model',
          author: { id: 3, username: 'prop_maker' },
          license_type: 'royalty_free',
          formats: ['fbx', 'obj'],
          categories: [{ name: 'Props' }],
          tags: ['book', 'antique'],
          price: '0.00',
          is_free: true,
          created_at: '2022-09-01T00:00:00Z',
        },
      ],
    });

    const results = await provider.search({ query: 'book' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('88');
    expect(m.source).toBe('cgtrader');
    expect(m.formats).toContain('fbx');
    expect(m.metadata.isFree).toBe(true);
  });
});

// ---- Blend Swap ----
describe('BlendSwap provider', () => {
  const provider = require('../src/providers/blendswap');

  it('search returns normalised models', async () => {
    getJSON.mockResolvedValue({
      blends: [
        {
          id: 222,
          name: 'Forest Scene',
          description: 'A complete forest scene in Blender',
          user: { id: 15, username: 'blendmaster' },
          license: { label: 'CC-BY' },
          preview: 'https://blendswap.com/forest.jpg',
          category: { name: 'Environments' },
          tags: ['forest', 'nature', 'outdoor'],
          created_at: '2021-08-01T00:00:00Z',
          download_count: 800,
          blender_version: '3.5',
        },
      ],
    });

    const results = await provider.search({ query: 'forest' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('222');
    expect(m.source).toBe('blendswap');
    expect(m.formats).toContain('blend');
    expect(m.categories).toContain('Environments');
  });
});

// ---- Free3D ----
describe('Free3D provider', () => {
  const provider = require('../src/providers/free3d');

  it('search returns normalised models', async () => {
    getJSON.mockResolvedValue({
      models: [
        {
          id: 333,
          title: 'Vintage Car',
          slug: 'vintage-car',
          description: 'Classic 1950s car',
          username: 'car_artist',
          user_id: 20,
          file_type: 'fbx',
          thumbnail: 'https://free3d.com/vintage-car.jpg',
          category: 'Vehicles',
          tags: 'car,vintage,classic',
          is_free: true,
          date_added: '2021-01-01',
          downloads: 2000,
        },
      ],
    });

    const results = await provider.search({ query: 'car' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('333');
    expect(m.source).toBe('free3d');
    expect(m.formats).toContain('fbx');
    expect(m.tags).toContain('car');
    expect(m.metadata.isFree).toBe(true);
  });
});

// ---- Smithsonian ----
describe('Smithsonian provider', () => {
  const provider = require('../src/providers/smithsonian');

  it('search returns normalised models', async () => {
    getJSON.mockResolvedValue({
      rows: [
        {
          id: 'edanmdm:nasm_A19820060000',
          url: '/object/edanmdm:nasm_A19820060000',
          source: 'NASM',
          content: {
            descriptiveNonRepeating: {
              title: { content: 'Wright Flyer' },
              unit_code: 'NASM',
              online_media: {
                media: [
                  {
                    content: 'https://3d.si.edu/download/wright-flyer.glb',
                    thumbnail: 'https://3d.si.edu/thumb/wright-flyer.jpg',
                  },
                ],
              },
            },
            indexedStructured: {
              topic: ['Aviation', 'Historic Aircraft'],
              date: ['1903'],
            },
            freetext: {
              notes: [{ content: 'The original Wright Flyer from 1903' }],
            },
          },
        },
      ],
    });

    const results = await provider.search({ query: 'wright' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.source).toBe('smithsonian');
    expect(m.name).toBe('Wright Flyer');
    expect(m.license).toBe('CC0');
    expect(m.author.name).toBe('Smithsonian Institution');
    expect(m.tags).toContain('Aviation');
  });
});

// ---- NIH ----
describe('NIH provider', () => {
  const provider = require('../src/providers/nih');

  it('search returns normalised models', async () => {
    getJSON.mockResolvedValue([
      {
        nid: '101',
        title: 'Human Heart',
        body: 'Detailed model of the human heart',
        name: 'Dr. Smith',
        uid: '55',
        field_thumbnail_image_url: 'https://3dprint.nih.gov/heart-thumb.jpg',
        field_download_link: 'https://3dprint.nih.gov/download/101',
        field_license: 'CC0',
        field_model_category: 'Anatomy',
        field_tags: 'heart,anatomy,human',
        created: '1609459200',
        changed: '1625097600',
      },
    ]);

    const results = await provider.search({ query: 'heart' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('101');
    expect(m.source).toBe('nih');
    expect(m.name).toBe('Human Heart');
    expect(m.license).toBe('CC0');
    expect(m.categories).toContain('Anatomy');
    expect(m.tags).toContain('heart');
    expect(m.tags).toContain('anatomy');
  });
});

// ---- Poly Pizza ----
describe('PolyPizza provider', () => {
  const provider = require('../src/providers/polypizza');

  it('search returns normalised models', async () => {
    getJSON.mockResolvedValue({
      assets: [
        {
          ID: 'pizza-001',
          Title: 'Slice of Pizza',
          Description: 'Low poly pizza slice',
          Creator: { UserName: 'lowpoly_chef', DisplayName: 'LowPoly Chef' },
          Thumbnail: 'https://poly.pizza/img/pizza.jpg',
          Download: 'https://poly.pizza/dl/pizza-001.glb',
          Category: 'Food',
          Tags: ['food', 'pizza', 'lowpoly'],
          PublishDate: '2022-03-15T00:00:00Z',
          TriCount: 512,
          Animated: false,
        },
      ],
    });

    const results = await provider.search({ query: 'pizza' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('pizza-001');
    expect(m.source).toBe('polypizza');
    expect(m.license).toBe('CC-BY');
    expect(m.formats).toContain('glb');
    expect(m.categories).toContain('Food');
  });
});

// ---- Thangs ----
describe('Thangs provider', () => {
  const provider = require('../src/providers/thangs');

  it('search returns normalised models', async () => {
    getJSON.mockResolvedValue({
      models: [
        {
          id: 't-001',
          name: 'Mechanical Arm',
          description: 'A robotic mechanical arm',
          creator: { id: 'c1', username: 'robo_builder' },
          license: 'CC-BY',
          thumbnailUrl: 'https://thangs.com/arm-thumb.jpg',
          fileTypes: ['STL', 'OBJ'],
          tags: ['robot', 'arm', 'mechanical'],
          likeCount: 25,
        },
      ],
    });

    const results = await provider.search({ query: 'arm' });
    expect(results).toHaveLength(1);
    const m = results[0];
    expect(m.id).toBe('t-001');
    expect(m.source).toBe('thangs');
    expect(m.formats).toContain('stl');
    expect(m.tags).toContain('robot');
  });
});
