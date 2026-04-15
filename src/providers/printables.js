'use strict';

/**
 * Printables Provider
 *
 * Printables (https://www.printables.com) is Prusa Research's community
 * platform for sharing free, printable 3D models.
 *
 * The platform exposes a public GraphQL API (no auth required for public
 * read operations). This provider searches via that API.
 */

const { postJSON } = require('../utils/http');
const { createModel } = require('../models/Model');

const GRAPHQL_URL = 'https://api.printables.com/graphql/';
const SITE_URL = 'https://www.printables.com';

/**
 * @typedef {Object} PrintablesSearchOptions
 * @property {string}   [query]    - Search keywords
 * @property {string}   [category] - Category ID or slug
 * @property {number}   [limit]    - Results per page (default: 20)
 * @property {number}   [page]     - Page number, 1-based (default: 1)
 * @property {string}   [ordering] - Sort order: "-likes_count","-download_count","name"
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

const PRINT_SEARCH_QUERY = `
query PrintSearch(
  $query: String
  $categoryId: ID
  $limit: Int
  $offset: Int
  $ordering: String
) {
  prints(
    query: $query
    categoryId: $categoryId
    limit: $limit
    offset: $offset
    ordering: $ordering
    onlyFree: true
  ) {
    items {
      id
      name
      slug
      description
      license { name }
      image { filePath }
      user { id publicUsername slug }
      datePublish
      dateModified
      category { name }
      tags { name }
      downloadCount
      likesCount
      stlFileCount
    }
    totalCount
  }
}
`;

/**
 * @param {Object} item  - Raw Printables GraphQL node
 * @returns {import('../models/Model').Model}
 */
function normalise(item) {
  const imageBase = 'https://media.printables.com/';
  const thumbnail = item.image?.filePath
    ? `${imageBase}${item.image.filePath}`
    : null;

  return createModel({
    id: String(item.id),
    name: item.name ?? '',
    description: item.description ?? '',
    author: {
      id: String(item.user?.id ?? ''),
      name: item.user?.publicUsername ?? item.user?.slug ?? '',
      url: item.user?.slug ? `${SITE_URL}/@${item.user.slug}` : null,
    },
    license: item.license?.name ?? 'CC-BY',
    source: 'printables',
    sourceUrl: `${SITE_URL}/model/${item.id}`,
    downloadUrl: `${SITE_URL}/model/${item.id}`,
    thumbnailUrl: thumbnail,
    formats: ['stl'],
    categories: item.category?.name ? [item.category.name] : [],
    tags: (item.tags ?? []).map((t) => t.name ?? t),
    createdAt: item.datePublish ?? null,
    updatedAt: item.dateModified ?? null,
    metadata: {
      downloadCount: item.downloadCount,
      likesCount: item.likesCount,
      stlFileCount: item.stlFileCount,
    },
  });
}

/**
 * Search Printables for free 3D models.
 *
 * @param {PrintablesSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const {
    query,
    category,
    limit = 20,
    page = 1,
    ordering = '-likes_count',
    fetchFn,
  } = options;

  const variables = {
    query: query ?? '',
    categoryId: category ?? null,
    limit,
    offset: (page - 1) * limit,
    ordering,
  };

  const data = await postJSON(
    GRAPHQL_URL,
    { query: PRINT_SEARCH_QUERY, variables },
    { fetchFn }
  );

  const items = data?.data?.prints?.items ?? [];
  return items.map(normalise);
}

module.exports = { search, id: 'printables' };
