'use strict';

/**
 * Sketchfab Provider
 *
 * Sketchfab (https://sketchfab.com) is the world's largest platform for
 * 3D models. This provider searches only free, downloadable models.
 *
 * API docs: https://docs.sketchfab.com/data-api/v3/
 * An API token is optional for listing public free models.
 * A token IS required to obtain direct download links.
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://api.sketchfab.com/v3';

/**
 * @typedef {Object} SketchfabSearchOptions
 * @property {string}   [query]     - Search keywords
 * @property {string}   [categories]- Category slug
 * @property {string}   [license]   - License type: "cc0","by","by-sa","by-nd","by-nc","by-nc-sa","by-nc-nd"
 * @property {number}   [limit]     - Results per page (max 24, default 20)
 * @property {number}   [page]      - Page cursor offset (default 0)
 * @property {string}   [apiKey]    - Sketchfab API token
 * @property {Function} [fetchFn]   - Custom fetch implementation
 */

/**
 * Map Sketchfab license identifiers to human-readable names.
 */
const LICENSE_MAP = {
  'cc0':     'CC0',
  'by':      'CC-BY',
  'by-sa':   'CC-BY-SA',
  'by-nd':   'CC-BY-ND',
  'by-nc':   'CC-BY-NC',
  'by-nc-sa':'CC-BY-NC-SA',
  'by-nc-nd':'CC-BY-NC-ND',
};

/**
 * Normalise a Sketchfab API model entry to the standard Model schema.
 *
 * @param {Object} item - Raw Sketchfab model object
 * @returns {import('../models/Model').Model}
 */
function normalise(item) {
  const thumbnail =
    item.thumbnails?.images?.sort((a, b) => b.width - a.width)[0]?.url ?? null;

  const formats = (item.archives?.source?.size ? ['source'] : []).concat(
    Object.keys(item.archives ?? {}).filter((k) => k !== 'source')
  );

  const licenseKey = (item.license?.slug ?? '').replace('creative-commons-', '');
  const license = LICENSE_MAP[licenseKey] ?? item.license?.label ?? 'Unknown';

  return createModel({
    id: item.uid,
    name: item.name ?? '',
    description: item.description ?? '',
    author: {
      id: item.user?.uid ?? null,
      name: item.user?.displayName ?? item.user?.username ?? '',
      url: item.user?.profileUrl ?? null,
    },
    license,
    source: 'sketchfab',
    sourceUrl: item.viewerUrl ?? `https://sketchfab.com/models/${item.uid}`,
    downloadUrl: null, // requires authentication — use item.uid with the download endpoint
    thumbnailUrl: thumbnail,
    formats,
    categories: (item.categories ?? []).map((c) => c.name ?? c.slug ?? ''),
    tags: (item.tags ?? []).map((t) => t.name ?? t.slug ?? ''),
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
    metadata: {
      vertexCount: item.vertexCount,
      faceCount: item.faceCount,
      animationCount: item.animationCount,
      isAnimated: item.isAnimated,
      viewCount: item.viewCount,
      likeCount: item.likeCount,
      downloadCount: item.downloadCount,
    },
  });
}

/**
 * Search Sketchfab for free, downloadable 3D models.
 *
 * @param {SketchfabSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const {
    query,
    categories,
    license,
    limit = 20,
    page = 0,
    apiKey,
    fetchFn,
  } = options;

  const params = {
    type: 'models',
    downloadable: true,
    count: Math.min(limit, 24),
    offset: page * Math.min(limit, 24),
  };

  if (query) params.q = query;
  if (categories) params.categories = categories;
  if (license) params.license = license;

  const headers = {};
  if (apiKey) headers['Authorization'] = `Token ${apiKey}`;

  const url = `${BASE_URL}/models${buildQuery(params)}`;
  const data = await getJSON(url, { headers, fetchFn });

  return (data.results ?? []).map(normalise);
}

module.exports = { search, id: 'sketchfab' };
