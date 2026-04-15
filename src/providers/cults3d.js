'use strict';

/**
 * Cults3D Provider
 *
 * Cults3D (https://cults3d.com) is a platform for sharing and downloading
 * 3D printable models, including a free / libre section.
 *
 * This provider uses the Cults3D GraphQL API to search for free creations.
 */

const { postJSON } = require('../utils/http');
const { createModel } = require('../models/Model');

const GRAPHQL_URL = 'https://cults3d.com/api/graphql';
const SITE_URL = 'https://cults3d.com';

/**
 * @typedef {Object} Cults3DSearchOptions
 * @property {string}   [query]    - Search keywords
 * @property {number}   [limit]    - Results per page (default: 20)
 * @property {number}   [page]     - Page number, 1-based (default: 1)
 * @property {string}   [sort]     - Sort: "PUBLISHED_AT","DOWNLOADS","LIKES"
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

const SEARCH_QUERY = `
query SearchCreations(
  $query: String
  $free: Boolean
  $limit: Int
  $offset: Int
  $sort: CreationSortEnum
) {
  searchCreations(
    q: $query
    free: $free
    limit: $limit
    offset: $offset
    sort: $sort
  ) {
    creations {
      id
      slug
      name
      description
      license { spdxIdentifier name }
      illustrationImageUrl
      creator { nick avatarImageUrl }
      categories { slug name }
      tags
      publishedAt
      downloadsCount
      likesCount
    }
    totalCount
  }
}
`;

/**
 * @param {Object} creation  - Raw Cults3D GraphQL creation node
 * @returns {import('../models/Model').Model}
 */
function normalise(creation) {
  const id = String(creation.id ?? '');

  return createModel({
    id,
    name: creation.name ?? '',
    description: creation.description ?? '',
    author: {
      id: null,
      name: creation.creator?.nick ?? '',
      url: creation.creator?.nick
        ? `${SITE_URL}/${creation.creator.nick}`
        : null,
    },
    license:
      creation.license?.spdxIdentifier ?? creation.license?.name ?? 'Unknown',
    source: 'cults3d',
    sourceUrl: creation.slug
      ? `${SITE_URL}/en/3d-model/${creation.slug}`
      : `${SITE_URL}/en/3d-model/${id}`,
    downloadUrl: creation.slug
      ? `${SITE_URL}/en/3d-model/${creation.slug}`
      : null,
    thumbnailUrl: creation.illustrationImageUrl ?? null,
    formats: ['stl', 'obj', 'blend', 'svg'],
    categories: (creation.categories ?? []).map((c) => c.name ?? c.slug ?? ''),
    tags: creation.tags ?? [],
    createdAt: creation.publishedAt ?? null,
    updatedAt: null,
    metadata: {
      downloadsCount: creation.downloadsCount,
      likesCount: creation.likesCount,
    },
  });
}

/**
 * Search Cults3D for free 3D models.
 *
 * @param {Cults3DSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const { query, limit = 20, page = 1, sort = 'PUBLISHED_AT', fetchFn } = options;

  const variables = {
    query: query ?? '',
    free: true,
    limit,
    offset: (page - 1) * limit,
    sort,
  };

  const data = await postJSON(
    GRAPHQL_URL,
    { query: SEARCH_QUERY, variables },
    { fetchFn }
  );

  const creations = data?.data?.searchCreations?.creations ?? [];
  return creations.map(normalise);
}

module.exports = { search, id: 'cults3d' };
