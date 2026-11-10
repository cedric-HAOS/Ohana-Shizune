import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {runInNewContext} from 'node:vm';

// The INFRA-01 update card: what is shown, and which requests it offers.
const source = readFileSync(new URL('../Shizune/PWA/app.js', import.meta.url), 'utf8')
  .replaceAll('\r\n', '\n');
const block = name => {
  const start = source.indexOf(`const ${name} =`);
  assert.ok(start >= 0, `${name} exists in the PWA`);
  return source.slice(start, source.indexOf('\n\n', start));
};
const renderer = ['escapeHtml', 'countLabel', 'formatDate', 'ageLabel', 'MARK', 'SYSTEM_MARK',
  'systemRunning', 'helperLines', 'systemActions', 'systemCard']
  .map(block).join('\n') + '\nsystemCard(system, options);';
const render = (system, options = {}) => runInNewContext(renderer, {system, options, Intl, Date});

const idle = {installed: true, refresh: {state: 'succeeded', finished_at: '2026-11-10T08:00:00+01:00'}, upgrade: {state: 'never'}};
const pending = {
  status: 'security_updates', message: '2 mise(s) à jour de sécurité en attente.',
  pending_count: 5, security_count: 2, kernel_pending: false, lists_stale: false,
  lists_refreshed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  reboot_required: false, read_at: new Date().toISOString(), helper: idle,
};

test('pending updates offer the check and the upgrade', () => {
  const html = render(pending);
  assert.ok(html.includes('2 mise(s) à jour de sécurité en attente.'));
  assert.ok(html.includes('5 paquets en attente, dont 2 de sécurité'));
  assert.ok(html.includes('Listes de paquets actualisées il y a 30 min'));
  assert.ok(html.includes('data-action="system-refresh"'));
  assert.ok(html.includes('data-action="system-confirm"'));
  assert.ok(!html.includes('data-action="system-apply"'), 'no upgrade without confirmation');
  assert.ok(html.includes('Actualisation des listes : réussie le'));
});

test('the upgrade asks for a confirmation that says what it does', () => {
  const html = render(pending, {confirming: true});
  assert.ok(html.includes('Installer 5 mises à jour sur INFRA-01 ?'));
  assert.ok(html.includes('INFRA-01 n’est jamais redémarré'));
  assert.ok(html.includes('data-action="system-apply"'));
  assert.ok(html.includes('data-action="system-cancel"'));
  assert.ok(!html.includes('data-action="system-refresh"'));
});

test('an up-to-date system or stale lists never offer the upgrade', () => {
  const upToDate = render({...pending, status: 'up_to_date', message: 'Le système est à jour.', pending_count: 0, security_count: 0});
  assert.ok(upToDate.includes('Le système est à jour.'));
  assert.ok(upToDate.includes('data-action="system-refresh"'));
  assert.ok(!upToDate.includes('system-confirm'));
  const stale = render({...pending, status: 'stale_lists', lists_stale: true});
  assert.ok(!stale.includes('system-confirm'));
  assert.ok(stale.includes('vérifier d’abord'));
});

test('a running helper replaces the buttons by its progress', () => {
  const html = render({...pending, helper: {installed: true, refresh: {state: 'never'}, upgrade: {state: 'running', started_at: '2026-11-10T10:00:00+01:00'}}});
  assert.ok(html.includes('Installation des mises à jour en cours depuis'));
  assert.ok(html.includes('Une opération est en cours'));
  assert.ok(!html.includes('data-action="system-refresh"'));
  assert.ok(!html.includes('system-confirm'));
});

test('a failed upgrade and a required reboot are said plainly', () => {
  const html = render({...pending, status: 'reboot_required', reboot_required: true, kernel_pending: true,
    helper: {installed: true, refresh: {state: 'never'}, upgrade: {state: 'failed', finished_at: '2026-11-10T10:05:00+01:00'}}});
  assert.ok(html.includes('Installation des mises à jour : en échec le'));
  assert.ok(html.includes('Ohana ne redémarre jamais INFRA-01'));
  assert.ok(html.includes('Un nouveau noyau sera installé'));
});

test('without the Installer helpers nothing can be requested', () => {
  for (const helper of [{installed: false}, null, undefined]) {
    const html = render({...pending, helper});
    assert.ok(html.includes('ne sont pas installés sur INFRA-01'));
    assert.ok(!html.includes('<button class="blue"'));
    assert.ok(!html.includes('system-refresh'));
  }
});

test('reading and failure states are explicit, and text is escaped', () => {
  assert.ok(render(null).includes('Lecture de l’état des mises à jour'));
  const failed = render(null, {error: 'Agent <injoignable>'});
  assert.ok(failed.includes('Lecture impossible : Agent &lt;injoignable&gt;'));
  assert.ok(failed.includes('data-action="system"'));
  const kept = render({...pending, message: '<b>x</b>'}, {error: 'délai dépassé'});
  assert.ok(kept.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.ok(kept.includes('Dernière lecture impossible : délai dépassé'));
});
