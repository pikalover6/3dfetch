'use strict';

/**
 * Provider registry — maps provider slugs to their implementation modules.
 *
 * Each module must export:
 *   - {string}   id     - unique slug (must match the registry key)
 *   - {Function} search - async search(options) -> Model[]
 */

const polyhaven    = require('./polyhaven');
const sketchfab    = require('./sketchfab');
const thingiverse  = require('./thingiverse');
const myminifactory = require('./myminifactory');
const printables   = require('./printables');
const thangs       = require('./thangs');
const polypizza    = require('./polypizza');
const nasa         = require('./nasa');
const smithsonian  = require('./smithsonian');
const nih          = require('./nih');
const grabcad      = require('./grabcad');
const cgtrader     = require('./cgtrader');
const ambientcg    = require('./ambientcg');
const blendswap    = require('./blendswap');
const cults3d      = require('./cults3d');
const free3d       = require('./free3d');

/** @type {Record<string, import('./polyhaven')>} */
const PROVIDERS = {
  [polyhaven.id]:     polyhaven,
  [sketchfab.id]:     sketchfab,
  [thingiverse.id]:   thingiverse,
  [myminifactory.id]: myminifactory,
  [printables.id]:    printables,
  [thangs.id]:        thangs,
  [polypizza.id]:     polypizza,
  [nasa.id]:          nasa,
  [smithsonian.id]:   smithsonian,
  [nih.id]:           nih,
  [grabcad.id]:       grabcad,
  [cgtrader.id]:      cgtrader,
  [ambientcg.id]:     ambientcg,
  [blendswap.id]:     blendswap,
  [cults3d.id]:       cults3d,
  [free3d.id]:        free3d,
};

/**
 * Get the list of registered provider IDs.
 *
 * @returns {string[]}
 */
function listProviders() {
  return Object.keys(PROVIDERS);
}

/**
 * Get a provider by its slug.
 *
 * @param {string} id
 * @returns {Object|undefined}
 */
function getProvider(id) {
  return PROVIDERS[id];
}

/**
 * Get all providers as an array.
 *
 * @returns {Object[]}
 */
function getAllProviders() {
  return Object.values(PROVIDERS);
}

module.exports = { PROVIDERS, listProviders, getProvider, getAllProviders };
