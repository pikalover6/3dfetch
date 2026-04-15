'use strict';

/**
 * AmbientCG Provider
 *
 * AmbientCG (https://ambientcg.com) provides hundreds of free, CC0-licensed
 * PBR materials, textures, and 3D models. All assets are entirely free.
 *
 * Public API — no authentication required.
 * Docs: https://ambientcg.com/api/v2/
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://ambientcg.com/api/v2';
const SITE_URL = 'https://ambientcg.com';

/**
 * @typedef {Object} AmbientCGSearchOptions
 * @property {string}   [query]       - Search keywords
 * @property {string}   [type]        - Asset type filter: "3DModel","Material","HDR"
 * @property {number}   [limit]       - Results per page (default: 20)
 * @property {number}   [offset]      - Start offset (default: 0)
 * @property {string}   [sortingField]- "downloadCount","latestCreatedAt","assetId"
 * @property {Function} [fetchFn]     - Custom fetch implementation
 */

/**
 * @param {Object} asset  - Raw AmbientCG asset entry
 * @returns {import('../models/Model').Model}
 */
function normalise(asset) {
  const id = asset.assetId ?? '';

  const previewImage =
    asset.previewImage ?? asset.images?.find((i) => i.type === 'Preview') ?? null;

  const thumbnail =
    typeof previewImage === 'string'
      ? previewImage
      : previewImage?.downloadLink ?? null;

  const downloads = asset.downloadFolders?.default?.downloadFiletypes ?? {};
  const downloadUrl =
    Object.values(downloads)[0]?.downloadLink ?? null;

  const formats = Object.keys(downloads).map((k) => k.toLowerCase());

  return createModel({
    id,
    name: asset.assetId ?? '',
    description: asset.tags ? `Tags: ${asset.tags.join(', ')}` : '',
    author: {
      id: null,
      name: 'AmbientCG',
      url: 'https://ambientcg.com',
    },
    license: 'CC0',
    source: 'ambientcg',
    sourceUrl: `${SITE_URL}/get#${id}`,
    downloadUrl,
    thumbnailUrl: thumbnail,
    formats,
    categories: asset.category ? [asset.category] : [],
    tags: asset.tags ?? [],
    createdAt: asset.creationDate ?? null,
    updatedAt: asset.latestUpdateDate ?? null,
    metadata: {
      downloadCount: asset.downloadCount,
      dimensionX: asset.dimensionX,
      dimensionY: asset.dimensionY,
      releaseMethod: asset.releaseMethod,
    },
  });
}

/**
 * Search AmbientCG for free CC0 3D assets.
 *
 * @param {AmbientCGSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const {
    query,
    type = '3DModel',
    limit = 20,
    offset = 0,
    sortingField = 'downloadCount',
    fetchFn,
  } = options;

  const params = {
    type,
    limit,
    offset,
    sortingField,
    include: 'downloadData,imageData',
  };
  if (query) params.q = query;

  const url = `${BASE_URL}/full_json${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  const items = data.foundAssets ?? data.assets ?? [];
  return items.map(normalise);
}

module.exports = { search, id: 'ambientcg' };
