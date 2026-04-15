'use strict';

/**
 * CGTrader Provider
 *
 * CGTrader (https://www.cgtrader.com) is one of the largest 3D model
 * marketplaces. This provider searches specifically for free models using
 * the CGTrader public API.
 *
 * API docs: https://www.cgtrader.com/developers
 * No API key required for public search.
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://www.cgtrader.com/api/v3';
const SITE_URL = 'https://www.cgtrader.com';

/**
 * @typedef {Object} CGTraderSearchOptions
 * @property {string}   [query]     - Search keywords
 * @property {string}   [category]  - Category ID or slug
 * @property {string}   [format]    - File format filter (e.g. "fbx", "obj")
 * @property {number}   [limit]     - Results per page (default: 20)
 * @property {number}   [page]      - Page number, 1-based (default: 1)
 * @property {string}   [sort]      - Sort: "best_match","newest","popular"
 * @property {Function} [fetchFn]   - Custom fetch implementation
 */

const LICENSE_MAP = {
  royalty_free: 'Royalty Free',
  editorial:    'Editorial',
  free:         'Free',
};

/**
 * @param {Object} model  - Raw CGTrader model entry
 * @returns {import('../models/Model').Model}
 */
function normalise(model) {
  const id = String(model.id ?? '');
  const slug = model.slug ?? id;

  const formats = (model.formats ?? []).map((f) =>
    typeof f === 'string' ? f.toLowerCase() : (f.name ?? '').toLowerCase()
  );

  const license =
    LICENSE_MAP[model.license_type] ??
    model.license_type ??
    'Royalty Free';

  return createModel({
    id,
    name: model.name ?? '',
    description: model.description ?? '',
    author: {
      id: String(model.author?.id ?? ''),
      name: model.author?.username ?? model.author?.name ?? '',
      url: model.author?.username
        ? `${SITE_URL}/users/${model.author.username}`
        : null,
    },
    license,
    source: 'cgtrader',
    sourceUrl: model.url ?? `${SITE_URL}/3d-models/${slug}`,
    downloadUrl: null, // requires login
    thumbnailUrl: model.thumbnail ?? model.preview ?? null,
    formats,
    categories: model.categories ? model.categories.map((c) => c.name ?? c) : [],
    tags: model.tags ?? [],
    createdAt: model.created_at ?? null,
    updatedAt: model.updated_at ?? null,
    metadata: {
      price: model.price,
      isFree: model.is_free || model.price === '0.00' || model.price === 0,
      likeCount: model.like_count,
      downloadCount: model.download_count,
      vertexCount: model.vertex_count,
      faceCount: model.face_count,
    },
  });
}

/**
 * Search CGTrader for free 3D models.
 *
 * @param {CGTraderSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const {
    query,
    category,
    format,
    limit = 20,
    page = 1,
    sort = 'best_match',
    fetchFn,
  } = options;

  const params = {
    per_page: limit,
    page,
    free: 1,
    sort,
  };
  if (query) params.q = query;
  if (category) params.category = category;
  if (format) params.format = format;

  const url = `${BASE_URL}/models${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  const items = data.models ?? data.items ?? data.data ?? [];
  return items.map(normalise);
}

module.exports = { search, id: 'cgtrader' };
