'use strict';

/**
 * Thingiverse Provider
 *
 * Thingiverse (https://www.thingiverse.com) is MakerBot's platform hosting
 * millions of free, printable 3D models.
 *
 * API docs: https://www.thingiverse.com/developers
 * An app token (client_id) is required.
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://api.thingiverse.com';
const SITE_URL = 'https://www.thingiverse.com';

/**
 * @typedef {Object} ThingiverseSearchOptions
 * @property {string}   query      - Search keywords (required for text search)
 * @property {string}   appToken   - Thingiverse app token / client_id (required)
 * @property {number}   [page]     - Page number, 1-based (default: 1)
 * @property {number}   [limit]    - Results per page (max 30, default 20)
 * @property {string}   [sort]     - Sort: "relevant","popular","newest","makes","derivatives"
 * @property {string}   [type]     - Category type slug
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

/**
 * Map a raw Thingiverse thing to the standard Model schema.
 *
 * @param {Object} thing
 * @returns {import('../models/Model').Model}
 */
function normalise(thing) {
  const thumbnail =
    thing.thumbnail ??
    thing.default_image?.sizes?.find((s) => s.type === 'thumb')?.url ??
    null;

  return createModel({
    id: String(thing.id),
    name: thing.name ?? '',
    description: thing.description ?? thing.description_html ?? '',
    author: {
      id: String(thing.creator?.id ?? ''),
      name: thing.creator?.name ?? '',
      url: thing.creator?.public_url
        ? `${SITE_URL}${thing.creator.public_url}`
        : null,
    },
    license: thing.license ?? 'CC-BY',
    source: 'thingiverse',
    sourceUrl: thing.public_url
      ? `${SITE_URL}${thing.public_url}`
      : `${SITE_URL}/thing:${thing.id}`,
    downloadUrl: `${SITE_URL}/thing:${thing.id}`,
    thumbnailUrl: thumbnail,
    formats: ['stl'],
    categories: thing.categories ? thing.categories.map((c) => c.name) : [],
    tags: thing.tags ? thing.tags.map((t) => t.name ?? t) : [],
    createdAt: thing.added ?? null,
    updatedAt: thing.modified ?? null,
    metadata: {
      makeCount: thing.make_count,
      commentCount: thing.comment_count,
      likeCount: thing.like_count,
      viewCount: thing.view_count,
      isWip: thing.is_wip,
      isPrivate: thing.is_private,
    },
  });
}

/**
 * Search Thingiverse for free 3D models.
 *
 * @param {ThingiverseSearchOptions} options
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const {
    query = '',
    appToken,
    page = 1,
    limit = 20,
    sort = 'relevant',
    type,
    fetchFn,
  } = options;

  if (!appToken) {
    throw new Error(
      'Thingiverse requires an app token. ' +
        'Create one at https://www.thingiverse.com/apps/create'
    );
  }

  const params = {
    per_page: Math.min(limit, 30),
    page,
    sort,
  };
  if (type) params.type = type;

  const url = query
    ? `${BASE_URL}/search/${encodeURIComponent(query)}${buildQuery(params)}`
    : `${BASE_URL}/things${buildQuery(params)}`;

  const data = await getJSON(url, {
    headers: { Authorization: `Bearer ${appToken}` },
    fetchFn,
  });

  const items = Array.isArray(data) ? data : data.hits ?? [];
  return items.map(normalise);
}

module.exports = { search, id: 'thingiverse' };
