# 3dfetch

> **Unified JavaScript library for fetching free-to-download 3D models from a wide variety of online sources.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

`3dfetch` provides a single, consistent API for searching and retrieving free 3D models from **16 different platforms** — no matter whether the source is a REST API, a GraphQL endpoint, or a specialist search engine.

Every result is normalised into the same **`Model` schema** so you can write platform-agnostic code that works across all sources.

---

## Supported Sources

| Provider | Slug | Auth required | License type |
|---|---|---|---|
| [PolyHaven](https://polyhaven.com) | `polyhaven` | ❌ None | CC0 |
| [Sketchfab](https://sketchfab.com) | `sketchfab` | Optional API token | CC0 / CC-BY / etc. |
| [Thingiverse](https://www.thingiverse.com) | `thingiverse` | ✅ App token | CC-BY / CC-BY-SA / etc. |
| [MyMiniFactory](https://www.myminifactory.com) | `myminifactory` | ✅ API key | CC-BY / etc. |
| [Printables](https://www.printables.com) | `printables` | ❌ None | CC-BY / etc. |
| [Thangs](https://thangs.com) | `thangs` | ❌ None | Various |
| [Poly Pizza](https://poly.pizza) | `polypizza` | ❌ None | CC-BY |
| [NASA 3D Resources](https://nasa3d.arc.nasa.gov) | `nasa` | ❌ None | NASA Media License |
| [Smithsonian 3D](https://3d.si.edu) | `smithsonian` | ❌ None | CC0 |
| [NIH 3D Print Exchange](https://3dprint.nih.gov) | `nih` | ❌ None | CC0 |
| [GrabCAD](https://grabcad.com) | `grabcad` | ❌ None | GrabCAD Community |
| [CGTrader](https://www.cgtrader.com) | `cgtrader` | ❌ None | Royalty Free |
| [AmbientCG](https://ambientcg.com) | `ambientcg` | ❌ None | CC0 |
| [Blend Swap](https://www.blendswap.com) | `blendswap` | ❌ None | CC-BY / CC0 |
| [Cults3D](https://cults3d.com) | `cults3d` | ❌ None | Various |
| [Free3D](https://free3d.com) | `free3d` | ❌ None | Free |

---

## Installation

```bash
npm install 3dfetch
```

Node.js 18 or later is required (for the built-in `fetch` API). For older Node.js versions pass a `fetchFn` such as [`node-fetch`](https://www.npmjs.com/package/node-fetch).

---

## Quick Start

```js
const { Fetch3D } = require('3dfetch');

const client = new Fetch3D();

// Search a single provider
const models = await client.search('polyhaven', { query: 'chair', limit: 10 });
console.log(models[0]);
// {
//   id: 'wooden_chair',
//   name: 'Wooden Chair',
//   source: 'polyhaven',
//   license: 'CC0',
//   downloadUrl: 'https://polyhaven.com/a/wooden_chair',
//   formats: ['blend','fbx','gltf','obj','usd'],
//   ...
// }

// Search all providers simultaneously
const { models: all, errors } = await client.searchAll({ query: 'spaceship', limit: 5 });
console.log(`Found ${all.length} models across all sources`);
console.log('Failed providers:', Object.keys(errors));
```

---

## API Reference

### `new Fetch3D(options?)`

Creates a new client instance.

| Option | Type | Description |
|---|---|---|
| `apiKeys` | `Object` | Map of `{ providerId: 'your-api-key' }` |
| `fetchFn` | `Function` | Custom `fetch` implementation (e.g. `node-fetch`) |
| `timeout` | `number` | Default request timeout in ms (default: `15000`) |

#### API keys per provider

```js
const client = new Fetch3D({
  apiKeys: {
    sketchfab: 'your-sketchfab-token',
    thingiverse: 'your-thingiverse-app-token',
    myminifactory: 'your-myminifactory-api-key',
  },
});
```

---

### `client.search(providerId, options?)`

Search a **single** provider and return a normalised array of `Model` objects.

```js
const models = await client.search('printables', {
  query: 'vase',
  limit: 20,
  page: 1,
  category: 'home-decor',
  license: 'CC0',        // client-side filter
  formats: ['stl'],      // client-side filter
  tags: ['vase'],        // client-side filter
  sortBy: 'name',        // 'name' | 'createdAt' | 'updatedAt'
  order: 'asc',          // 'asc' | 'desc'
});
```

**Throws** if `providerId` is not recognised.

---

### `client.searchAll(searchOptions?, multiOptions?)`

Search **multiple providers simultaneously** (or sequentially) and merge results.

```js
const { models, errors } = await client.searchAll(
  // search options (forwarded to each provider)
  { query: 'dragon', limit: 10, license: 'CC0' },
  // multi-search options
  {
    providers: ['polyhaven', 'printables', 'thingiverse'], // default: all
    mode: 'parallel',    // 'parallel' (default) | 'sequential'
    deduplicate: true,   // remove duplicates by source+id (default: true)
  }
);
```

Returns `{ models: Model[], errors: { [providerId]: string } }`.  
Failed providers are silently skipped; their errors are collected in the `errors` object so you can handle them gracefully.

---

### `client.listProviders()`

Returns an array of all registered provider slugs.

```js
const ids = client.listProviders();
// ['polyhaven', 'sketchfab', 'thingiverse', ...]
```

---

## Model Schema

Every provider returns objects conforming to this schema:

```ts
interface Model {
  id:           string;        // Unique ID on the source platform
  name:         string;        // Display name / title
  description:  string;        // Description (may be empty)
  author: {
    id:   string | null;       // Author ID on the source platform
    name: string;              // Author display name
    url:  string | null;       // Author profile URL
  };
  license:      string;        // SPDX or platform-specific license name
  source:       string;        // Provider slug (e.g. "polyhaven")
  sourceUrl:    string;        // Canonical page URL
  downloadUrl:  string | null; // Direct download URL (null if auth required)
  thumbnailUrl: string | null; // Preview image URL
  formats:      string[];      // Available file formats (e.g. ["glb","fbx","obj"])
  categories:   string[];      // Platform categories
  tags:         string[];      // Freeform tags / keywords
  createdAt:    string | null; // ISO-8601 creation timestamp
  updatedAt:    string | null; // ISO-8601 last-updated timestamp
  metadata:     Object;        // Provider-specific extra fields
}
```

---

## Filtering

`3dfetch` supports two layers of filtering:

1. **Server-side** — options like `query`, `category`, `page`, `limit` are sent to the provider's API (where supported).
2. **Client-side** — `license`, `formats`, `categories`, `tags`, and `query` are applied locally after results are returned. This guarantees consistent filtering across all providers regardless of what the API supports.

---

## Advanced Examples

### Using a custom fetch (older Node.js / testing)

```js
const fetch = require('node-fetch');
const { Fetch3D } = require('3dfetch');

const client = new Fetch3D({ fetchFn: fetch });
```

### Searching with multiple filters

```js
const models = await client.search('sketchfab', {
  query: 'low poly character',
  license: 'CC0',
  formats: ['glb', 'fbx'],
  sortBy: 'createdAt',
  order: 'desc',
  limit: 12,
});
```

### Searching all providers and handling errors

```js
const { models, errors } = await client.searchAll({ query: 'tree', limit: 5 });

if (Object.keys(errors).length > 0) {
  console.warn('Some providers failed:', errors);
}

for (const model of models) {
  console.log(`[${model.source}] ${model.name} — ${model.license}`);
}
```

### Listing and using providers directly

```js
const { PROVIDERS, listProviders } = require('3dfetch');

console.log(listProviders());
// ['polyhaven', 'sketchfab', ...]

const models = await PROVIDERS.nasa.search({ query: 'mars' });
```

### Deduplication

When searching multiple providers with `searchAll`, results are deduplicated by `source + id` by default. Set `deduplicate: false` to disable.

---

## Utilities

Individual utilities are also exported for convenience:

```js
const { applyFilters, deduplicateModels, sortModels, createModel } = require('3dfetch');

// Apply filters to an existing array of models
const cc0Only = applyFilters(models, { license: 'CC0' });

// Sort results
const sorted = sortModels(models, 'createdAt', 'desc');

// Remove duplicates
const unique = deduplicateModels(models);
```

---

## Provider Notes

### PolyHaven
All assets are **CC0 (public domain)**. No API key required. Downloads are available in Blend, FBX, GLTF, OBJ, and USD formats.

### Sketchfab
Searching public, downloadable models requires no key. To retrieve **direct download links** you need a [Sketchfab API token](https://sketchfab.com/settings/password).

### Thingiverse
Requires a free [Thingiverse app token](https://www.thingiverse.com/apps/create). Pass it via `apiKeys: { thingiverse: 'your-token' }`.

### MyMiniFactory
Requires a free [MyMiniFactory API key](https://www.myminifactory.com/pages/myminifactory-api). Pass it via `apiKeys: { myminifactory: 'your-key' }`.

### Printables
Uses the public **GraphQL API** — no authentication needed. Results include only free models (`onlyFree: true`).

### NASA 3D Resources
All models are freely available under the [NASA Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). No API key required.

### Smithsonian 3D
All assets are **CC0**. Part of the Smithsonian's Open Access initiative.

### NIH 3D Print Exchange
Scientific and medical models, mostly CC0. No authentication required.

### GrabCAD
Engineering CAD models under the GrabCAD Community License. No API key required.

### AmbientCG
All assets are **CC0**. Includes PBR materials and 3D models.

---

## Running Tests

```bash
npm test
```

All provider logic is tested with mocked HTTP responses so no network access is needed.

---

## License

MIT
