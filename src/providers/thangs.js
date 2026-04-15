'use strict';

/**
 * Thangs Provider
 *
 * Thangs (https://thangs.com) is a 3D model search engine and community
 * platform that aggregates models from multiple sources.
 *
 * This provider uses Thangs' public search API to discover free models.
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://thangs.com/api';
const SITE_URL = 'https://thangs.com';

/**
 * @typedef {Object} ThangsSearchOptions
 * @property {string}   [query]    - Search keywords
 * @property {number}   [limit]    - Results per page (default: 20)
 * @property {number}   [page]     - Page number, 0-based (default: 0)
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

/**
 * @param {Object} model  - Raw Thangs model object
 * @returns {import('../models/Model').Model}
 */
function normalise(model) {
  return createModel({
    id: String(model.id ?? model.modelId ?? ''),
    name: model.name ?? model.title ?? '',
    description: model.description ?? '',
    author: {
      id: String(model.creator?.id ?? ''),
      name: model.creator?.username ?? model.creator?.name ?? '',
      url: model.creator?.username
        ? `${SITE_URL}/@${model.creator.username}`
        : null,
    },
    license: model.license ?? 'Unknown',
    source: 'thangs',
    sourceUrl: model.url ?? (model.id ? `${SITE_URL}/model/${model.id}` : ''),
    downloadUrl: model.downloadUrl ?? null,
    thumbnailUrl: model.thumbnailUrl ?? model.thumbnail ?? null,
    formats: model.fileTypes ? model.fileTypes.map((f) => f.toLowerCase()) : [],
    categories: model.categories ?? [],
    tags: model.tags ?? [],
    createdAt: model.createdAt ?? null,
    updatedAt: model.updatedAt ?? null,
    metadata: {
      likeCount: model.likeCount,
      downloadCount: model.downloadCount,
      commentCount: model.commentCount,
    },
  });
}

/**
 * Search Thangs for 3D models.
 *
 * @param {ThangsSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const { query = '', limit = 20, page = 0, fetchFn } = options;

  const params = {
    q: query,
    per_page: limit,
    page,
  };

  const url = `${BASE_URL}/models/search${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  const items = data.models ?? data.results ?? data.items ?? [];
  return items.map(normalise);
}

module.exports = { search, id: 'thangs' };
