'use strict';

/**
 * Poly Pizza Provider
 *
 * Poly Pizza (https://poly.pizza) hosts thousands of free, low-polygon
 * 3D models licensed under CC-BY. Formerly known as Google Poly.
 *
 * API docs: https://poly.pizza/api-docs
 * No API key required for public search.
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://api.poly.pizza/v1';
const SITE_URL = 'https://poly.pizza';

/**
 * @typedef {Object} PolyPizzaSearchOptions
 * @property {string}   [query]    - Search keywords
 * @property {string}   [category] - Category filter
 * @property {number}   [limit]    - Results per page (default: 20)
 * @property {number}   [page]     - Page number, 1-based (default: 1)
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

/**
 * @param {Object} item  - Raw Poly Pizza model entry
 * @returns {import('../models/Model').Model}
 */
function normalise(item) {
  return createModel({
    id: item.ID ?? item.id ?? '',
    name: item.Title ?? item.name ?? '',
    description: item.Description ?? item.description ?? '',
    author: {
      id: item.Creator?.UserName ?? null,
      name: item.Creator?.DisplayName ?? item.Creator?.UserName ?? '',
      url: item.Creator?.UserName
        ? `${SITE_URL}/u/${item.Creator.UserName}`
        : null,
    },
    license: 'CC-BY',
    source: 'polypizza',
    sourceUrl: item.ID ? `${SITE_URL}/${item.ID}` : '',
    downloadUrl: item.Download ?? item.download ?? null,
    thumbnailUrl: item.Thumbnail ?? item.thumbnail ?? null,
    formats: ['glb'],
    categories: item.Category ? [item.Category] : [],
    tags: item.Tags ?? item.tags ?? [],
    createdAt: item.PublishDate ?? item.publishDate ?? null,
    updatedAt: null,
    metadata: {
      triCount: item.TriCount,
      animated: item.Animated,
    },
  });
}

/**
 * Search Poly Pizza for free low-poly 3D models.
 *
 * @param {PolyPizzaSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const { query = '', category, limit = 20, page = 1, fetchFn } = options;

  const params = { limit, page };
  if (query) params.q = query;
  if (category) params.category = category;

  const url = `${BASE_URL}/models${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  const items = data.assets ?? data.results ?? data.models ?? [];
  return items.map(normalise);
}

/**
 * Fetch available Poly Pizza categories.
 *
 * @param {Object} [options]
 * @param {Function} [options.fetchFn]
 * @returns {Promise<string[]>}
 */
async function getCategories(options = {}) {
  const { fetchFn } = options;
  const data = await getJSON(`${BASE_URL}/categories`, { fetchFn });
  return Array.isArray(data) ? data : Object.keys(data);
}

module.exports = { search, getCategories, id: 'polypizza' };
