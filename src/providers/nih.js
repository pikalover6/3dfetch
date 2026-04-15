'use strict';

/**
 * NIH 3D Print Exchange Provider
 *
 * The NIH 3D Print Exchange (https://3dprint.nih.gov) is a U.S. government
 * repository of scientifically accurate, free 3D printable models of
 * biological molecules, medical devices, anatomical structures, and more.
 *
 * Public API — no authentication required.
 * API base: https://3dprint.nih.gov/api/v1/
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://3dprint.nih.gov/api/v1';
const SITE_URL = 'https://3dprint.nih.gov';

/**
 * @typedef {Object} NihSearchOptions
 * @property {string}   [query]    - Search keywords
 * @property {string}   [category] - Category/type filter
 * @property {number}   [limit]    - Results per page (default: 20)
 * @property {number}   [page]     - Page number, 0-based (default: 0)
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

/**
 * @param {Object} item  - Raw NIH Print Exchange record
 * @returns {import('../models/Model').Model}
 */
function normalise(item) {
  const id = String(item.nid ?? item.id ?? '');
  const thumbnail = item.field_thumbnail_image_url ?? item.thumbnail ?? null;
  const downloadUrl =
    item.field_download_link ?? item.download_url ?? null;

  return createModel({
    id,
    name: item.title ?? '',
    description: item.body ?? item.description ?? '',
    author: {
      id: String(item.uid ?? ''),
      name: item.name ?? item.author ?? '',
      url: item.uid ? `${SITE_URL}/users/${item.uid}` : null,
    },
    license: item.field_license ?? 'CC0',
    source: 'nih',
    sourceUrl: item.url ?? `${SITE_URL}/discover/${id}`,
    downloadUrl,
    thumbnailUrl: thumbnail,
    formats: ['stl', 'obj'],
    categories: item.field_model_category ? [item.field_model_category] : [],
    tags: item.field_tags ? item.field_tags.split(',').map((t) => t.trim()) : [],
    createdAt: item.created
      ? new Date(Number(item.created) * 1000).toISOString()
      : null,
    updatedAt: item.changed
      ? new Date(Number(item.changed) * 1000).toISOString()
      : null,
    metadata: {
      printTime: item.field_print_time,
      material: item.field_material,
      resolution: item.field_resolution,
    },
  });
}

/**
 * Search the NIH 3D Print Exchange.
 *
 * @param {NihSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const { query, category, limit = 20, page = 0, fetchFn } = options;

  const params = {
    display_id: 'rest_model_search',
    limit,
    offset: page * limit,
  };
  if (query) params.search = query;
  if (category) params.category = category;

  const url = `${BASE_URL}/model${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  const items = Array.isArray(data) ? data : data.items ?? [];
  return items.map(normalise);
}

module.exports = { search, id: 'nih' };
