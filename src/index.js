'use strict';

/**
 * 3dfetch — Unified JS library for fetching free-to-download 3D models.
 *
 * @example
 * const { Fetch3D } = require('3dfetch');
 *
 * const client = new Fetch3D();
 * const models = await client.search('polyhaven', { query: 'chair' });
 */

const Fetch3D = require('./fetch3d');
const { PROVIDERS, listProviders, getProvider, getAllProviders } = require('./providers');
const { createModel } = require('./models/Model');
const { applyFilters, deduplicateModels, sortModels } = require('./utils/filters');
const { getJSON, postJSON, buildQuery } = require('./utils/http');

// Individual provider exports for direct usage
const providers = require('./providers');

module.exports = {
  /** Main client class */
  Fetch3D,

  /** Provider utilities */
  PROVIDERS,
  listProviders,
  getProvider,
  getAllProviders,
  providers,

  /** Model utilities */
  createModel,

  /** Filter utilities */
  applyFilters,
  deduplicateModels,
  sortModels,

  /** HTTP utilities */
  getJSON,
  postJSON,
  buildQuery,
};
