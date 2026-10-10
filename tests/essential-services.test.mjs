import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {runInNewContext} from 'node:vm';

// Exercise the actual PWA card with the companion contract, without booting
// IndexedDB, pairing or network polling.
const source = readFileSync(new URL('../Shizune/PWA/app.js', import.meta.url), 'utf8')
  .replaceAll('\r\n', '\n');
const block = name => {
  const start = source.indexOf(`const ${name} =`);
  assert.ok(start >= 0, `${name} exists in the PWA`);
  return source.slice(start, source.indexOf('\n\n', start));
};
const renderer = ['escapeHtml', 'ageLabel', 'MARK', 'servicesCard']
  .map(block).join('\n') + '\nservicesCard(payload);';

for (const [status, detail, tone] of [
  ['healthy', 'Dernière synchro il y a 3 min', 'good'],
  ['critical', 'Synchronisation en défaut', 'bad'],
  ['unknown', 'Synchronisation non vérifiée', 'unk'],
]) {
  test(`AdGuard synchronization appears among essential services: ${status}`, () => {
    const html = runInNewContext(renderer, {payload: {
      checked_at: new Date().toISOString(),
      items: [
        {id: 'dns', label: 'DNS', status: 'healthy', detail: '7,9 ms'},
        {id: 'adguard_sync', label: 'Synchro AdGuard', status, detail},
      ],
    }});
    assert.ok(html.includes('Services essentiels'));
    assert.ok(html.includes('<strong>DNS</strong>'));
    assert.ok(html.includes(`<span class="ic ${tone}">`));
    assert.ok(html.includes('<strong>Synchro AdGuard</strong>'));
    assert.ok(html.includes(`<small>${detail}</small>`));
    assert.equal((html.match(/class="tile"/g) ?? []).length, 2);
  });
}
