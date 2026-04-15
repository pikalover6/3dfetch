'use strict';

/**
 * Free3D Provider
 *
 * Free3D (https://free3d.com) hosts a large collection of free and paid
 * 3D models in multiple formats. The free section is usable without purchase.
 *
 * This provider uses the Free3D search endpoint.
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://free3d.com/api';
const SITE_URL = 'https://free3d.com';

/**
 * @typedef {Object} Free3DSearchOptions
 * @property {string}   [query]    - Search keywords
 * @property {string}   [format]   - File format filter (e.g. "3ds","obj","fbx","blend","c4d")
 * @property {number}   [limit]    - Results per page (default: 20)
 * @property {number}   [page]     - Page number, 1-based (default: 1)
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

/**
 * @param {Object} model  - Raw Free3D model entry
 * @returns {import('../models/Model').Model}
 */
function normalise(model) {
  const id = String(model.id ?? '');
  const slug = model.slug ?? id;

  return createModel({
    id,
    name: model.title ?? model.name ?? '',
    description: model.description ?? '',
    author: {
      id: String(model.user_id ?? ''),
      name: model.username ?? '',
      url: model.username ? `${SITE_URL}/user/${model.username}` : null,
    },
    license: model.is_free ? 'Free' : 'Paid',
    source: 'free3d',
    sourceUrl: `${SITE_URL}/3d-model/${slug}`,
    downloadUrl: model.is_free ? `${SITE_URL}/3d-model/${slug}` : null,
    thumbnailUrl: model.thumbnail ?? model.image ?? null,
    formats: model.file_type
      ? [model.file_type.toLowerCase()]
      : (model.formats ?? []).map((f) => f.toLowerCase()),
    categories: model.category ? [model.category] : [],
    tags: model.tags ? model.tags.split(',').map((t) => t.trim()) : [],
    createdAt: model.date_added ?? model.created_at ?? null,
    updatedAt: model.date_modified ?? null,
    metadata: {
      downloadCount: model.downloads,
      viewCount: model.views,
      ratingCount: model.rating_count,
      rating: model.rating,
      polygons: model.polygons,
      isFree: model.is_free,
    },
  });
}

/**
 * Search Free3D for free 3D models.
 *
 * @param {Free3DSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const { query, format, limit = 20, page = 1, fetchFn } = options;

  const params = {
    per_page: limit,
    page,
    is_free: 1,
  };
  if (query) params.q = query;
  if (format) params.file_type = format;

  const url = `${BASE_URL}/search${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  const items = data.models ?? data.items ?? data.results ?? [];
  return items.map(normalise);
}

module.exports = { search, id: 'free3d' };
