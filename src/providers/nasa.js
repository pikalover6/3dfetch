'use strict';

/**
 * NASA 3D Resources Provider
 *
 * NASA (https://nasa3d.arc.nasa.gov) provides a curated library of free
 * 3D models of spacecraft, planets, astronauts and more.
 *
 * Public API — no authentication required.
 * Data: https://nasa3d.arc.nasa.gov/api/search
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://nasa3d.arc.nasa.gov';

/**
 * @typedef {Object} NasaSearchOptions
 * @property {string}   [query]    - Search keywords
 * @property {number}   [limit]    - Max results (default: 20)
 * @property {number}   [page]     - Page number, 1-based (default: 1)
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

/**
 * @param {Object} item  - Raw NASA 3D resource entry
 * @returns {import('../models/Model').Model}
 */
function normalise(item) {
  const slug = item.file_type ?? '';
  const formats = slug ? [slug.toLowerCase()] : [];

  const thumbnail =
    item.thumbnail_url ??
    (item.file_name ? `${BASE_URL}/detail/${item.file_name}` : null);

  return createModel({
    id: item.file_name ?? item.id ?? String(item.nasa_id ?? ''),
    name: item.title ?? '',
    description: item.description ?? '',
    author: {
      id: null,
      name: 'NASA',
      url: 'https://www.nasa.gov',
    },
    license: 'NASA Media License',
    source: 'nasa',
    sourceUrl: item.detail_url ?? `${BASE_URL}/detail/${item.file_name}`,
    downloadUrl: item.download_url ?? item.detail_url ?? null,
    thumbnailUrl: thumbnail,
    formats,
    categories: item.tags ? item.tags.filter((t) => typeof t === 'string') : [],
    tags: item.tags ?? [],
    createdAt: item.date_added ?? null,
    updatedAt: item.date_modified ?? null,
    metadata: {
      type: item.type,
      mission: item.mission,
      fileSize: item.file_size,
    },
  });
}

/**
 * Search NASA 3D Resources.
 *
 * @param {NasaSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const { query = '', limit = 20, page = 1, fetchFn } = options;

  const params = { limit, page };
  if (query) params.q = query;

  const url = `${BASE_URL}/api/search${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  const items =
    data.items ?? data.results ?? (Array.isArray(data) ? data : []);
  return items.slice(0, limit).map(normalise);
}

module.exports = { search, id: 'nasa' };
