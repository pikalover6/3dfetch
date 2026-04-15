'use strict';

/**
 * GrabCAD Provider
 *
 * GrabCAD (https://grabcad.com) is a community-driven repository of free,
 * professional-grade engineering CAD models shared under the GrabCAD
 * Community License.
 *
 * API docs: https://grabcad.com/community/api
 * No authentication required for public model listing.
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://grabcad.com/community/api/v1';
const SITE_URL = 'https://grabcad.com';

/**
 * @typedef {Object} GrabCadSearchOptions
 * @property {string}   [query]    - Search keywords
 * @property {number}   [limit]    - Results per page (default: 20)
 * @property {number}   [page]     - Page number, 1-based (default: 1)
 * @property {string}   [sort]     - Sort field: "recent","popular","like"
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

/**
 * @param {Object} model  - Raw GrabCAD community model
 * @returns {import('../models/Model').Model}
 */
function normalise(model) {
  const id = String(model.id ?? '');
  const slug = model.slug ?? id;
  const files = model.cad_files ?? [];
  const formats = [
    ...new Set(
      files
        .map((f) => (f.name ?? '').split('.').pop().toLowerCase())
        .filter(Boolean)
    ),
  ];

  return createModel({
    id,
    name: model.name ?? '',
    description: model.description ?? '',
    author: {
      id: String(model.owner?.id ?? ''),
      name: model.owner?.display_name ?? model.owner?.username ?? '',
      url: model.owner?.username
        ? `${SITE_URL}/library/user/${model.owner.username}`
        : null,
    },
    license: 'GrabCAD Community License',
    source: 'grabcad',
    sourceUrl: `${SITE_URL}/library/${slug}`,
    downloadUrl: `${SITE_URL}/library/${slug}`,
    thumbnailUrl: model.preview_image?.url ?? null,
    formats,
    categories: model.software_list
      ? model.software_list.map((s) => s.name ?? s)
      : [],
    tags: model.tag_list ?? [],
    createdAt: model.created_at ?? null,
    updatedAt: model.updated_at ?? null,
    metadata: {
      likeCount: model.like_count,
      downloadCount: model.download_count,
      commentCount: model.comments_count,
      followerCount: model.follower_count,
    },
  });
}

/**
 * Search GrabCAD for free CAD models.
 *
 * @param {GrabCadSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const { query, limit = 20, page = 1, sort = 'recent', fetchFn } = options;

  const params = {
    per_page: limit,
    page,
    sort,
  };
  if (query) params.q = query;

  const url = `${BASE_URL}/models${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  const items = data.models ?? data.items ?? (Array.isArray(data) ? data : []);
  return items.map(normalise);
}

module.exports = { search, id: 'grabcad' };
