'use strict';

/**
 * Smithsonian 3D Digitization Provider
 *
 * The Smithsonian Institution (https://3d.si.edu) provides free 3D models
 * of museum artifacts and natural specimens under open-access licenses.
 *
 * Public API — no authentication required.
 * Docs: https://3d.si.edu/docs/
 */

const { getJSON, buildQuery } = require('../utils/http');
const { createModel } = require('../models/Model');

const BASE_URL = 'https://3d.si.edu/api';
const SITE_URL = 'https://3d.si.edu';

/**
 * @typedef {Object} SmithsonianSearchOptions
 * @property {string}   [query]    - Search keywords
 * @property {number}   [limit]    - Results per page (default: 20)
 * @property {number}   [start]    - Start offset (default: 0)
 * @property {Function} [fetchFn]  - Custom fetch implementation
 */

/**
 * @param {Object} item  - Raw Smithsonian 3D API result
 * @returns {import('../models/Model').Model}
 */
function normalise(item) {
  const id = item.id ?? item.edan_id ?? '';
  const content = item.content ?? {};
  const descriptiveNonRepeating = content.descriptiveNonRepeating ?? {};
  const indexedStructured = content.indexedStructured ?? {};
  const freetext = content.freetext ?? {};

  const title =
    descriptiveNonRepeating.title?.content ??
    descriptiveNonRepeating.title ??
    item.title ??
    '';

  const thumbnail =
    descriptiveNonRepeating.online_media?.media?.[0]?.thumbnail ??
    descriptiveNonRepeating.online_media?.media?.[0]?.content ??
    null;

  const downloadUrl =
    descriptiveNonRepeating.online_media?.media?.[0]?.content ?? null;

  const date =
    indexedStructured.date?.join('') ??
    freetext.date?.[0]?.content ??
    null;

  const topics = (indexedStructured.topic ?? []).concat(
    (freetext.topic ?? []).map((t) => t.content)
  );

  return createModel({
    id,
    name: title,
    description:
      freetext.notes?.[0]?.content ?? freetext.description?.[0]?.content ?? '',
    author: {
      id: null,
      name: 'Smithsonian Institution',
      url: 'https://www.si.edu',
    },
    license: 'CC0',
    source: 'smithsonian',
    sourceUrl: item.url ? `${SITE_URL}${item.url}` : `${SITE_URL}/object/${id}`,
    downloadUrl,
    thumbnailUrl: thumbnail,
    formats: ['glb', 'obj'],
    categories: topics.slice(0, 5),
    tags: topics,
    createdAt: date,
    updatedAt: null,
    metadata: {
      unitCode: descriptiveNonRepeating.unit_code,
      recordLink: descriptiveNonRepeating.record_link,
      dataSource: item.source,
    },
  });
}

/**
 * Search the Smithsonian 3D Digitization collection.
 *
 * @param {SmithsonianSearchOptions} [options]
 * @returns {Promise<import('../models/Model').Model[]>}
 */
async function search(options = {}) {
  const { query = '', limit = 20, start = 0, fetchFn } = options;

  const params = {
    q: query || '*:*',
    rows: limit,
    start,
  };

  const url = `${BASE_URL}/search${buildQuery(params)}`;
  const data = await getJSON(url, { fetchFn });

  const items = data.rows ?? data.items ?? data.results ?? [];
  return items.map(normalise);
}

module.exports = { search, id: 'smithsonian' };
