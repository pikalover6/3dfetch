'use strict';

/**
 * PolyHaven Provider
 *
 * PolyHaven (https://polyhaven.com) is a free, open-source repository of
 * 3D assets. All assets are CC0 (public domain).
 *
 * Public API — no API key required.
 * Docs: https://polyhaven.com/api
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://api.polyhaven.com';
const SITE_URL = 'https://polyhaven.com';

/**
 * @typedef {import('../utils/http').HttpOptions} HttpOptions
 * @typedef {import('../models/Model').Model} Model
 */

/**
 * @typedef {Object} PolyHavenSearchOptions
 * @property {string}   [query]   - Filter by name (client-side)
 * @property {string}   [category]- Category slug (e.g. "furniture", "nature")
 * @property {number}   [limit]   - Max results to return (default: 20)
 * @property {number}   [page]    - Page number, 1-based (default: 1)
 * @property {Function} [fetchFn] - Custom fetch implementation
 */

/**
 * Search PolyHaven for free 3D models.
 *
 * @param {PolyHavenSearchOptions} [options]
 * @returns {Promise<Model[]>}
 */
async function search(options = {}) {
  const { query, category, limit = 20, page = 1, fetchFn } = options;

  const params = { t: 'models' };
  if (category) params.c = category;

  const url = `${BASE_URL}/assets${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  let entries = Object.entries(data);

  if (query) {
    const q = query.toLowerCase();
    entries = entries.filter(([id, asset]) =>
      id.toLowerCase().includes(q) ||
      (asset.name ?? '').toLowerCase().includes(q) ||
      (asset.tags ?? []).some((t) => t.toLowerCase().includes(q))
    );
  }

  const start = (page - 1) * limit;
  const pageEntries = entries.slice(start, start + limit);

  return pageEntries.map(([id, asset]) => {
    const downloadUrl = `${SITE_URL}/a/${id}`;
    const thumbnailUrl = `https://cdn.polyhaven.com/asset_img/thumbs/${id}.png?height=200`;

    return createModel({
      id,
      name: asset.name ?? id,
      description: '',
      author: {
        id: null,
        name: Array.isArray(asset.authors)
          ? asset.authors.join(', ')
          : typeof asset.authors === 'object' && asset.authors !== null
          ? Object.keys(asset.authors).join(', ')
          : '',
        url: null,
      },
      license: 'CC0',
      source: 'polyhaven',
      sourceUrl: `${SITE_URL}/a/${id}`,
      downloadUrl,
      thumbnailUrl,
      formats: ['blend', 'fbx', 'gltf', 'obj', 'usd'],
      categories: asset.categories ?? [],
      tags: asset.tags ?? [],
      createdAt: asset.date_published
        ? new Date(asset.date_published * 1000).toISOString()
        : null,
      updatedAt: null,
      metadata: {
        evs_cap: asset.evs_cap,
        whitebalance: asset.whitebalance,
        size: asset.size_human,
        dimensions: asset.dimensions,
        type: asset.type,
      },
    });
  });
}

/**
 * Fetch available PolyHaven model categories.
 *
 * @param {Object} [options]
 * @param {Function} [options.fetchFn]
 * @returns {Promise<string[]>}
 */
async function getCategories(options = {}) {
  const { fetchFn } = options;
  const data = await getJSON(`${BASE_URL}/categories/models`, { fetchFn });
  return Object.keys(data);
}

module.exports = { search, getCategories, id: 'polyhaven' };
