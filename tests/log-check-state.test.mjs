import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {runInNewContext} from 'node:vm';

// The logs card must say how the latest daily check ended, not only when.
const source = readFileSync(new URL('../Shizune/PWA/app.js', import.meta.url), 'utf8')
  .replaceAll('\r\n', '\n');
const block = name => {
  const start = source.indexOf(`const ${name} =`);
  assert.ok(start >= 0, `${name} exists in the PWA`);
  return source.slice(start, source.indexOf('\n\n', start));
};
const renderer = ['escapeHtml', 'formatDate', 'MARK', 'logCheckLine', 'logsCard']
  .map(block).join('\n') + '\nlogsCard(payload);';

const equipments = status => ['infra-01', 'ha-01'].map(id => ({
  equipment: id, label: id.toUpperCase(), incident_id: null, status,
  detail: status === 'unknown' ? 'Non vérifié : le dernier contrôle a échoué' : 'Aucune anomalie',
}));
const render = payload => runInNewContext(renderer, {payload, Intl, Date});

test('a failed check is announced and sources are not shown as clean', () => {
  const html = render({
    checked_at: '2026-11-04T05:02:00+01:00',
    last_check: {state: 'failed', at: '2026-11-06T05:02:35+01:00'},
    equipments: equipments('unknown'),
  });
  assert.ok(html.includes('Dernier contrôle en échec'));
  assert.ok(html.includes('dernier réussi le'));
  assert.ok(html.includes('class="block-sub urgent"'));
  assert.ok(html.includes('Non vérifié'));
  assert.ok(!html.includes('>OK<'));
});

test('a failed check without any earlier success says so', () => {
  const html = render({
    checked_at: null,
    last_check: {state: 'failed', at: '2026-11-06T05:02:35+01:00'},
    equipments: equipments('unknown'),
  });
  assert.ok(html.includes('aucun contrôle réussi connu'));
});

for (const [state, text] of [
  ['succeeded', 'Dernier contrôle réussi'],
  ['running', 'Contrôle en cours depuis'],
  ['waiting', 'Contrôle en attente de démarrage'],
  ['none', 'Aucun contrôle effectué'],
]) {
  test(`check state ${state} is stated without an alert`, () => {
    const html = render({
      checked_at: '2026-11-05T05:02:00+01:00',
      last_check: {state, at: '2026-11-06T05:02:35+01:00'},
      equipments: equipments('ok'),
    });
    assert.ok(html.includes(text));
    assert.ok(!html.includes('block-sub urgent'));
  });
}

test('an older Agent without last_check keeps the previous wording', () => {
  assert.ok(render({checked_at: '2026-11-05T05:02:00+01:00', equipments: equipments('ok')})
    .includes('Dernier contrôle : '));
  assert.ok(render({checked_at: null, equipments: equipments('ok')})
    .includes('Aucun contrôle terminé pour le moment'));
});
