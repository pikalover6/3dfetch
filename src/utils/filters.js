'use strict';

/**
 * Client-side filter utilities.
 *
 * These are applied after the provider returns a page of results, giving
 * callers consistent filtering across every source.
 */

/**
 * @typedef {import('../models/Model').Model} Model
 */

/**
 * @typedef {Object} FilterOptions
 * @property {string}   [query]     - Full-text search (checked against name/description/tags)
 * @property {string}   [license]   - License keyword (e.g. "CC0", "MIT", "CC-BY")
 * @property {string[]} [formats]   - Required file formats (model must support at least one)
 * @property {string[]} [categories]- Required categories (model must match at least one)
 * @property {string[]} [tags]      - Required tags (model must have at least one)
 * @property {string}   [source]    - Provider slug to restrict results to
 */

/**
 * Apply local post-processing filters to an array of models.
 *
 * @param {Model[]}       models
 * @param {FilterOptions} [filters]
 * @returns {Model[]}
 */
function applyFilters(models, filters = {}) {
  if (!filters || Object.keys(filters).length === 0) return models;

  return models.filter((model) => {
    if (filters.source && model.source !== filters.source) return false;

    if (filters.license) {
      const licenseStr = (model.license ?? '').toLowerCase();
      if (!licenseStr.includes(filters.license.toLowerCase())) return false;
    }

    if (filters.formats && filters.formats.length > 0) {
      const modelFormats = model.formats.map((f) => f.toLowerCase());
      const hasFormat = filters.formats.some((f) =>
        modelFormats.includes(f.toLowerCase())
      );
      if (!hasFormat) return false;
    }

    if (filters.categories && filters.categories.length > 0) {
      const modelCats = model.categories.map((c) => c.toLowerCase());
      const hasCat = filters.categories.some((c) =>
        modelCats.includes(c.toLowerCase())
      );
      if (!hasCat) return false;
    }

    if (filters.tags && filters.tags.length > 0) {
      const modelTags = model.tags.map((t) => t.toLowerCase());
      const hasTag = filters.tags.some((t) => modelTags.includes(t.toLowerCase()));
      if (!hasTag) return false;
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      const searchable = [
        model.name,
        model.description,
        ...model.tags,
        ...model.categories,
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}

/**
 * Deduplicate models by `source + id`.
 *
 * @param {Model[]} models
 * @returns {Model[]}
 */
function deduplicateModels(models) {
  const seen = new Set();
  return models.filter((m) => {
    const key = `${m.source}::${m.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Sort an array of models.
 *
 * @param {Model[]} models
 * @param {'name'|'createdAt'|'updatedAt'} [sortBy]
 * @param {'asc'|'desc'} [order]
 * @returns {Model[]}
 */
function sortModels(models, sortBy = 'name', order = 'asc') {
  const copy = [...models];
  copy.sort((a, b) => {
    let va = a[sortBy] ?? '';
    let vb = b[sortBy] ?? '';
    if (va < vb) return order === 'asc' ? -1 : 1;
    if (va > vb) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return copy;
}

module.exports = { applyFilters, deduplicateModels, sortModels };
