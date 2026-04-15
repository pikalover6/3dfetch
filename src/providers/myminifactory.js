'use strict';

/**
 * MyMiniFactory Provider
 *
 * MyMiniFactory (https://www.myminifactory.com) hosts free and paid 3D
 * printable models. This provider searches the free objects endpoint.
 *
 * API docs: https://www.myminifactory.com/pages/myminifactory-api
 * A free API key is required.
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://www.myminifactory.com/api/v2';
const SITE_URL = 'https://www.myminifactory.com';

/**
 * @typedef {Object} MyMiniFactorySearchOptions
 * @property {string}   [query]    - Search keywords
 * @property {string}   apiKey     - MyMiniFactory API key (required)
 * @property {number}   [page]     - Page number, 1-based (default: 1)
 * @property {number}   [limit]    - Results per page (default: 20)
 * @property {boolean}  [free]     - Only free objects (default: true)
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

/**
 * @param {Object} obj  - Raw MyMiniFactory object
 * @returns {import('../models/Model').Model}
 */
function normalise(obj) {
  const thumbnail =
    obj.images?.featured?.thumbnail?.url ??
    obj.images?.[0]?.thumbnail?.url ??
    null;

  return createModel({
    id: String(obj.id),
    name: obj.name ?? '',
    description: obj.description ?? obj.excerpt ?? '',
    author: {
      id: String(obj.designer?.id ?? ''),
      name: obj.designer?.name ?? obj.designer?.username ?? '',
      url: obj.designer?.profile_url
        ? `${SITE_URL}${obj.designer.profile_url}`
        : null,
    },
    license: obj.license ?? 'CC-BY',
    source: 'myminifactory',
    sourceUrl: obj.url ?? `${SITE_URL}/object/${obj.id}`,
    downloadUrl: obj.url ?? null,
    thumbnailUrl: thumbnail,
    formats: ['stl', 'obj'],
    categories: obj.categories ? obj.categories.map((c) => c.name ?? c) : [],
    tags: obj.tags ? obj.tags.map((t) => t.name ?? t) : [],
    createdAt: obj.published_at ?? obj.created_at ?? null,
    updatedAt: obj.updated_at ?? null,
    metadata: {
      likeCount: obj.likes,
      viewCount: obj.views,
      downloadCount: obj.download_count,
      isFree: obj.free,
      printTime: obj.print_time,
    },
  });
}

/**
 * Search MyMiniFactory for free 3D models.
 *
 * @param {MyMiniFactorySearchOptions} options
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const { query, apiKey, page = 1, limit = 20, free = true, fetchFn } = options;

  if (!apiKey) {
    throw new Error(
      'MyMiniFactory requires an API key. ' +
        'Register at https://www.myminifactory.com/pages/myminifactory-api'
    );
  }

  const params = {
    key: apiKey,
    per_page: limit,
    page,
    free: free ? 1 : 0,
  };
  if (query) params.q = query;

  const url = `${BASE_URL}/search${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  const items = data.items ?? data.objects ?? [];
  return items.map(normalise);
}

module.exports = { search, id: 'myminifactory' };
