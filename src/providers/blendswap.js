'use strict';

/**
 * Blend Swap Provider
 *
 * Blend Swap (https://www.blendswap.com) is a community repository of
 * Blender (.blend) files shared under Creative Commons licenses.
 *
 * API docs: https://www.blendswap.com/page/api
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://www.blendswap.com/api/v1';
const SITE_URL = 'https://www.blendswap.com';

/**
 * @typedef {Object} BlendSwapSearchOptions
 * @property {string}   [query]    - Search keywords
 * @property {string}   [license]  - License filter: "CC-0","CC-BY","CC-BY-SA","CC-BY-ND","CC-BY-NC","CC-BY-NC-SA","CC-BY-NC-ND"
 * @property {number}   [limit]    - Results per page (default: 20)
 * @property {number}   [page]     - Page number, 1-based (default: 1)
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

/**
 * @param {Object} blend  - Raw Blend Swap entry
 * @returns {import('../models/Model').Model}
 */
function normalise(blend) {
  const id = String(blend.id ?? '');

  return createModel({
    id,
    name: blend.name ?? blend.title ?? '',
    description: blend.description ?? '',
    author: {
      id: String(blend.user?.id ?? ''),
      name: blend.user?.username ?? blend.user?.name ?? '',
      url: blend.user?.username
        ? `${SITE_URL}/users/${blend.user.username}`
        : null,
    },
    license: blend.license?.label ?? blend.license ?? 'CC-BY',
    source: 'blendswap',
    sourceUrl: blend.url ?? `${SITE_URL}/blends/view/${id}`,
    downloadUrl: blend.download_url ?? null,
    thumbnailUrl: blend.preview ?? blend.thumbnail ?? null,
    formats: ['blend'],
    categories: blend.category ? [blend.category.name ?? blend.category] : [],
    tags: blend.tags ?? [],
    createdAt: blend.created_at ?? blend.date ?? null,
    updatedAt: blend.updated_at ?? null,
    metadata: {
      downloadCount: blend.download_count,
      rating: blend.rating,
      blenderVersion: blend.blender_version,
    },
  });
}

/**
 * Search Blend Swap for free Blender models.
 *
 * @param {BlendSwapSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const { query, license, limit = 20, page = 1, fetchFn } = options;

  const params = {
    per_page: limit,
    page,
  };
  if (query) params.q = query;
  if (license) params.license = license;

  const url = `${BASE_URL}/blends${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  const items = data.blends ?? data.items ?? (Array.isArray(data) ? data : []);
  return items.map(normalise);
}

module.exports = { search, id: 'blendswap' };
