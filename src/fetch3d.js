'use strict';

/**
 * Fetch3D — main client class.
 *
 * Usage:
 *
 *   const { Fetch3D } = require('3dfetch');
 *
 *   const client = new Fetch3D({ apiKeys: { sketchfab: 'your-token' } });
 *
 *   // Search a single provider
 *   const models = await client.search('polyhaven', { query: 'chair', limit: 10 });
 *
 *   // Search all providers simultaneously
 *   const all = await client.searchAll({ query: 'chair', limit: 5 });
 */

const { getProvider, getAllProviders, listProviders } = require('./providers');
const { applyFilters, deduplicateModels, sortModels } = require('./utils/filters');

/**
 * @typedef {Object} Fetch3DOptions
 * @property {Object}   [apiKeys]   - Map of provider id → API key/token
 *                                   e.g. { sketchfab: 'token', thingiverse: 'appToken' }
 * @property {Function} [fetchFn]   - Custom fetch implementation for all providers
 * @property {number}   [timeout]   - Default request timeout in ms (default: 15000)
 */

/**
 * @typedef {Object} SearchOptions
 * @property {string}   [query]      - Full-text search keywords
 * @property {number}   [limit]      - Results per page (default: 20)
 * @property {number}   [page]       - Page number (default: 1)
 * @property {string}   [category]   - Category filter (provider-specific)
 * @property {string[]} [tags]       - Tag filters (client-side post-filter)
 * @property {string}   [license]    - License keyword filter (client-side)
 * @property {string[]} [formats]    - Required file formats (client-side)
 * @property {string}   [sortBy]     - Sort field: "name","createdAt","updatedAt"
 * @property {'asc'|'desc'} [order]  - Sort direction (default: "asc")
 */

/**
 * @typedef {Object} SearchAllOptions
 * @property {string[]} [providers]  - List of provider IDs to search (default: all)
 * @property {'parallel'|'sequential'} [mode] - Fetch mode (default: "parallel")
 * @property {boolean}  [deduplicate]- Remove duplicate results (default: true)
 * @property {SearchOptions} [searchOptions] - Options forwarded to each provider search
 */

class Fetch3D {
  /**
   * @param {Fetch3DOptions} [options]
   */
  constructor(options = {}) {
    this._apiKeys = options.apiKeys ?? {};
    this._fetchFn = options.fetchFn;
    this._timeout = options.timeout ?? 15_000;
  }

  /**
   * Build per-provider search options, merging global client config with the
   * caller's options.
   *
   * @param {string}        providerId
   * @param {SearchOptions} options
   * @returns {Object}
   */
  _buildProviderOptions(providerId, options) {
    const base = {
      ...options,
      fetchFn: this._fetchFn,
      timeoutMs: this._timeout,
    };

    // Inject API keys using provider-specific key names
    const keys = this._apiKeys[providerId];
    if (keys) {
      switch (providerId) {
        case 'sketchfab':
          base.apiKey = keys;
          break;
        case 'thingiverse':
          base.appToken = keys;
          break;
        case 'myminifactory':
          base.apiKey = keys;
          break;
        default:
          base.apiKey = keys;
      }
    }

    return base;
  }

  /**
   * Search a single provider.
   *
   * @param {string}        providerId - Provider slug (e.g. "polyhaven", "sketchfab")
   * @param {SearchOptions} [options]
   * @returns {Promise<import('./models/Model').Model[]>}
   */
  async search(providerId, options = {}) {
    const provider = getProvider(providerId);
    if (!provider) {
      throw new Error(
        `Unknown provider: "${providerId}". ` +
          `Available providers: ${listProviders().join(', ')}`
      );
    }

    const providerOptions = this._buildProviderOptions(providerId, options);
    const results = await provider.search(providerOptions);

    // Apply client-side filters and sorting
    const filtered = applyFilters(results, {
      license: options.license,
      formats: options.formats,
      categories: options.categories,
      tags: options.tags,
    });

    if (options.sortBy) {
      return sortModels(filtered, options.sortBy, options.order ?? 'asc');
    }

    return filtered;
  }

  /**
   * Search multiple providers simultaneously.
   *
   * Failed providers are silently skipped; their errors are collected in the
   * returned metadata object.
   *
   * @param {SearchOptions} [searchOptions]     - Search/filter options forwarded to each provider
   * @param {Object}        [multiOptions]
   * @param {string[]}      [multiOptions.providers]  - Provider IDs to search (default: all)
   * @param {'parallel'|'sequential'} [multiOptions.mode] - Default: "parallel"
   * @param {boolean}       [multiOptions.deduplicate] - Default: true
   * @returns {Promise<{ models: import('./models/Model').Model[], errors: Object }>}
   */
  async searchAll(searchOptions = {}, multiOptions = {}) {
    const {
      providers = listProviders(),
      mode = 'parallel',
      deduplicate = true,
    } = multiOptions;

    const errors = {};
    const allModels = [];

    if (mode === 'sequential') {
      for (const id of providers) {
        try {
          const models = await this.search(id, searchOptions);
          allModels.push(...models);
        } catch (err) {
          errors[id] = err.message;
        }
      }
    } else {
      // parallel
      const results = await Promise.allSettled(
        providers.map((id) => this.search(id, searchOptions))
      );

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          allModels.push(...result.value);
        } else {
          errors[providers[idx]] = result.reason?.message ?? String(result.reason);
        }
      });
    }

    let models = deduplicate ? deduplicateModels(allModels) : allModels;

    if (searchOptions.sortBy) {
      models = sortModels(models, searchOptions.sortBy, searchOptions.order ?? 'asc');
    }

    return { models, errors };
  }

  /**
   * Get the list of all registered provider IDs.
   *
   * @returns {string[]}
   */
  listProviders() {
    return listProviders();
  }

  /**
   * Get details about a specific provider.
   *
   * @param {string} id
   * @returns {Object|undefined}
   */
  getProvider(id) {
    return getProvider(id);
  }
}

module.exports = Fetch3D;
