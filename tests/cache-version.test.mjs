import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

// A browser keeps an installed service worker until sw.js changes, and the
// worker only drops caches named differently: the name must follow the version.
const read = name => readFileSync(new URL(`../Shizune/PWA/${name}`, import.meta.url), 'utf8');

test('the service worker cache is named after the published version', () => {
  const {version} = JSON.parse(read('version.json'));
  const cache = read('sw.js').match(/const CACHE = '([^']+)';/);
  assert.ok(cache, 'sw.js declares its cache name');
  assert.equal(cache[1], `shizune-pwa-${version}`);
});
