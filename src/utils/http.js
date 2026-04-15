'use strict';

/**
 * Minimal HTTP helper wrapping the built-in fetch available in Node ≥ 18.
 * Falls back to a lightweight shim error for older runtimes.
 *
 * Every provider should call these helpers so that:
 *  - callers can inject a custom `fetchFn` for testing / mocking
 *  - a consistent User-Agent header is sent
 *  - JSON parsing errors surface with clear messages
 */

const DEFAULT_USER_AGENT = '3dfetch/1.0.0 (https://github.com/pikalover6/3dfetch)';
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Resolve the fetch implementation to use.
 * Priority: provided override → global `fetch` (Node 18+) → error.
 *
 * @param {Function|undefined} fetchFn
 * @returns {Function}
 */
function resolveFetch(fetchFn) {
  if (typeof fetchFn === 'function') return fetchFn;
  if (typeof globalThis.fetch === 'function') return globalThis.fetch.bind(globalThis);
  throw new Error(
    '3dfetch requires a Fetch API implementation. ' +
      'Use Node.js 18+ or pass a `fetchFn` option (e.g. node-fetch).'
  );
}

/**
 * Perform a GET request and return parsed JSON.
 *
 * @param {string}   url
 * @param {Object}   [options]
 * @param {Object}   [options.headers]       - Extra request headers
 * @param {Function} [options.fetchFn]       - Custom fetch implementation
 * @param {number}   [options.timeoutMs]     - Request timeout in milliseconds
 * @returns {Promise<any>}
 */
async function getJSON(url, options = {}) {
  const fetch = resolveFetch(options.fetchFn);
  const { headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        Accept: 'application/json',
        ...headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} — ${url}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Perform a POST request with a JSON body and return parsed JSON.
 *
 * @param {string}   url
 * @param {Object}   body
 * @param {Object}   [options]
 * @param {Object}   [options.headers]
 * @param {Function} [options.fetchFn]
 * @param {number}   [options.timeoutMs]
 * @returns {Promise<any>}
 */
async function postJSON(url, body, options = {}) {
  const fetch = resolveFetch(options.fetchFn);
  const { headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} — ${url}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Build a query string from an object, omitting null/undefined values.
 *
 * @param {Object} params
 * @returns {string}  e.g. "?q=chair&page=1"
 */
function buildQuery(params) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

module.exports = { getJSON, postJSON, buildQuery, resolveFetch };
