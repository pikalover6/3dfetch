'use strict';

/**
 * @typedef {Object} ModelAuthor
 * @property {string|null} id - Author ID on the source platform
 * @property {string} name - Author display name
 * @property {string|null} url - Author profile URL
 */

/**
 * Standardized 3D model schema returned by all providers.
 *
 * @typedef {Object} Model
 * @property {string}       id          - Unique ID within this source
 * @property {string}       name        - Model name / title
 * @property {string}       description - Model description (may be empty)
 * @property {ModelAuthor}  author      - Creator information
 * @property {string}       license     - SPDX license identifier or plain-text name
 * @property {string}       source      - Provider slug (e.g. "polyhaven", "sketchfab")
 * @property {string}       sourceUrl   - Canonical page URL on the source site
 * @property {string|null}  downloadUrl - Direct download URL (null if auth/redirect required)
 * @property {string|null}  thumbnailUrl - Preview image URL
 * @property {string[]}     formats     - Available file formats (e.g. ["glb","fbx","obj"])
 * @property {string[]}     categories  - Source-defined categories / collections
 * @property {string[]}     tags        - Freeform tags / keywords
 * @property {string|null}  createdAt   - ISO-8601 creation timestamp (null if unknown)
 * @property {string|null}  updatedAt   - ISO-8601 last-updated timestamp (null if unknown)
 * @property {Object}       metadata    - Provider-specific extra fields
 */

/**
 * Creates a normalised Model object, filling every optional field with a safe
 * default so consumers can always rely on the full schema.
 *
 * @param {Partial<Model>} data
 * @returns {Model}
 */
function createModel(data) {
  return {
    id: data.id ?? '',
    name: data.name ?? '',
    description: data.description ?? '',
    author: {
      id: data.author?.id ?? null,
      name: data.author?.name ?? '',
      url: data.author?.url ?? null,
    },
    license: data.license ?? 'Unknown',
    source: data.source ?? '',
    sourceUrl: data.sourceUrl ?? '',
    downloadUrl: data.downloadUrl ?? null,
    thumbnailUrl: data.thumbnailUrl ?? null,
    formats: Array.isArray(data.formats) ? data.formats : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    metadata: data.metadata ?? {},
  };
}

module.exports = { createModel };
