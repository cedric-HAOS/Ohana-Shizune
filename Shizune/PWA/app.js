const API_ROOT = '/api/shizune';
const DATABASE_NAME = 'ohana-shizune';
const STORE_NAME = 'secrets';
const DEVICE_ID_KEY = 'ohana-shizune-device-id';

const state = {
  view: 'home', deviceId: null, token: null, pairing: null,
  summary: null, requests: [], activity: [], loading: true, error: null,
  incidentId: null, notice: null, busy: false,
};

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const countLabel = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

const openVault = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DATABASE_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const vaultTransaction = async (mode, operation) => {
  const database = await openVault();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      operation(transaction.objectStore(STORE_NAME), resolve, reject);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
};

const vaultGet = key => vaultTransaction('readonly', (store, resolve, reject) => {
  const request = store.get(key);
  request.onsuccess = () => resolve(request.result ?? null);
  request.onerror = () => reject(request.error);
});

const vaultPut = (key, value) => vaultTransaction('readwrite', (store, resolve, reject) => {
  const request = store.put(value, key);
  request.onsuccess = () => resolve();
  request.onerror = () => reject(request.error);
});

const vaultDelete = key => vaultTransaction('readwrite', (store, resolve, reject) => {
  const request = store.delete(key);
  request.onsuccess = () => resolve();
  request.onerror = () => reject(request.error);
});

const saveToken = token => vaultPut('companion-token', token);

const loadToken = async () => {
  const token = await vaultGet('companion-token');
  return typeof token === 'string' && token ? token : null;
};

const randomIdentifier = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

const deviceId = () => {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const identifier = `pwa-${randomIdentifier()}`;
  localStorage.setItem(DEVICE_ID_KEY, identifier);
  return identifier;
};

const apiRequest = async (path, { method = 'GET', body, authenticated = true } = {}) => {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (authenticated) {
    if (!state.token || !state.deviceId) throw new Error('Session Shizune absente.');
    headers.Authorization = `Bearer ${state.token}`;
    headers['X-Ohana-Companion-Id'] = state.deviceId;
  }
  const response = await fetch(`${API_ROOT}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      state.token = null;
      await vaultDelete('companion-token');
    }
    throw new Error(payload.detail || payload.error || `Erreur HTTP ${response.status}`);
  }
  return payload;
};

const formatDate = value => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const healthPresentation = summary => ({
  healthy: ['Konoha : Stable', '✓', 'healthy'],
  degraded: ['Konoha : Dégradé', '!', 'degraded'],
  critical: ['Konoha : Critique', '!', 'critical'],
}[summary?.konoha_state] ?? ['Konoha : Inconnu', '?', 'unknown']);

const activityRows = items => items.length
  ? items.map(item => `<div class="activity-row"><span>${item.kind === 'result' ? '✓' : '⌁'}</span><span>${escapeHtml(item.title)}${item.detail ? `<small>${escapeHtml(item.detail)}</small>` : ''}</span><time>${formatDate(item.occurred_at)}</time></div>`).join('')
  : '<div class="empty compact">Aucune activité récente.</div>';

const requestCard = request => `<section class="section decision">
  <h2 class="section-title"><span class="section-icon">⚖</span>${request.kind === 'investigation_authorization' ? 'Collecte complémentaire' : 'Décision requise'}</h2>
  <div class="decision-copy"><span class="shield">♢</span><div><p>${escapeHtml(request.question)}</p><small>${escapeHtml(request.context)}</small></div></div>
  <div class="actions request-actions">${request.choices.map(choice => `<button class="${choice === 'AUTHORIZE' ? 'blue' : choice === 'REFUSE' ? 'danger' : ''}" data-action="respond" data-request-id="${escapeHtml(request.request_id)}" data-choice="${escapeHtml(choice)}">${{ AUTHORIZE: 'Autoriser', REFUSE: 'Refuser', LATER: 'Plus tard', CONFIRM: 'Confirmer' }[choice] ?? escapeHtml(choice)}</button>`).join('')}</div>
</section>`;

const connectionRequired = () => `<section class="section"><h2 class="section-title">Connexion à Konoha</h2><div class="empty">Shizune doit être associée à Tsunade avant d’afficher l’état réel.<br><button class="inline-primary" data-action="pair">Associer cet iPhone</button></div></section>`;

const home = () => {
  if (!state.token) return connectionRequired();
  if (!state.summary) return '<section class="section"><div class="empty">Synchronisation avec Tsunade…</div></section>';
  const incidents = state.summary.attention ?? [];
  const priority = incidents.filter(item => !['watch', 'resolved'].includes(item.assessment?.state));
  const first = priority[0];
  const remaining = incidents.filter(item => item !== first);
  const stale = remaining.filter(item => item.assessment?.state === 'stale').length;
  const analyzing = remaining.filter(item => item.assessment?.state === 'analyzing').length;
  const watching = remaining.filter(item => item.assessment?.state === 'watch').length;
  const groupSummary = [stale ? `${countLabel(stale, 'analyse', 'analyses')} à actualiser` : '', analyzing ? `${countLabel(analyzing, 'analyse', 'analyses')} en cours ou en attente` : '', watching ? `${countLabel(watching, 'équipement', 'équipements')} sous surveillance` : ''].filter(Boolean).join(' · ');
  const headline = first ? 'Ce qui demande votre attention'
    : incidents.length ? 'Tsunade poursuit la surveillance' : 'Aucun incident actif signalé';
  return `
    <header class="essential-heading"><p>L’ESSENTIEL</p><h2>${headline}</h2></header>
    ${state.requests.length ? `<section class="section decision"><h2>${countLabel(state.requests.length, 'décision en attente', 'décisions en attente')}</h2><button class="inline-primary" data-action="decisions">Voir les demandes</button></section>` : ''}
    ${first ? incidentCard(first, true) : ''}
    ${remaining.length ? `<section class="section"><h2 class="section-title">${countLabel(remaining.length, 'autre sujet suivi', 'autres sujets suivis')}</h2><p>${escapeHtml(groupSummary || 'Les derniers constats et prochaines étapes sont disponibles.')}</p><button class="inline-secondary" data-action="incidents">Voir les équipements →</button></section>` : ''}
    ${state.summary.attention_truncated ? '<p class="hint">Les incidents prioritaires sont présentés ici. Le dossier complet est disponible dans Vision.</p>' : ''}
    <p class="hint">${state.requests.length ? '' : 'Aucune autorisation en attente. '}${state.summary.last_checked_at ? `Dernier constat : ${formatDate(state.summary.last_checked_at)}.` : 'Aucun constat récent disponible.'}</p>
    <button class="inline-secondary" data-action="refresh">Actualiser</button>`;
};

const incidentCard = (item, prominent = false) => {
  const assessment = item.assessment ?? {};
  const label = assessment.label ?? 'Incident à examiner';
  return `<article class="${prominent ? 'section priority-incident' : 'incident-row'} ${item.severity === 'critical' ? 'critical' : ''}">
    <span class="assessment-label">${escapeHtml(label)}</span>
    <h3>${escapeHtml(assessment.title ?? item.equipment)}</h3>
    <p>${assessment.finding_count != null ? `${assessment.finding_count} anomalies regroupées au dernier contrôle.` : escapeHtml(item.message)}</p>
    <button class="${prominent ? 'inline-primary' : 'inline-secondary'}" data-action="incident" data-incident-id="${escapeHtml(item.incident_id)}">Voir le problème →</button>
  </article>`;
};

const incidentDetail = () => {
  const item = state.summary?.attention?.find(value => value.incident_id === state.incidentId);
  if (!item) return '<section class="section"><p>Cet incident n’est plus dans la synthèse active.</p><button class="inline-secondary" data-action="home">Retour à l’essentiel</button></section>';
  const a = item.assessment ?? {};
  return `<button class="inline-secondary" data-action="home">← L’essentiel</button>
    <section class="section priority-incident ${item.severity === 'critical' ? 'critical' : ''}">
      <span class="assessment-label">${escapeHtml(a.label ?? 'À examiner')}</span><h2>${escapeHtml(a.title ?? item.equipment)}</h2>
      <p>${escapeHtml(item.message)}</p><p class="hint">Incident ouvert le ${formatDate(item.started_at)} · dernier constat ${formatDate(a.observed_at)}</p>
      ${a.conclusion ? `<div class="incident-conclusion"><h3>${a.decision_current ? 'Conclusion Tsunade' : 'Conclusion précédente'}</h3><p>${escapeHtml(a.conclusion)}</p>${a.reason ? `<p>${escapeHtml(a.reason)}</p>` : ''}<p class="hint">${formatDate(a.decided_at)}${a.confidence != null ? ` · confiance ${Math.round(a.confidence * 100)} %` : ''}</p></div>` : '<p class="incident-conclusion">La cause et l’impact restent à préciser par le diagnostic.</p>'}
      ${a.state === 'stale' ? '<p class="hint">De nouveaux éléments sont disponibles depuis cette conclusion.</p>' : ''}
      ${a.recommended_action ? `<p class="incident-conclusion"><strong>Prochaine étape</strong><br>${escapeHtml(a.recommended_action)}</p>` : ''}
      ${a.next_action === 'diagnose' ? `<button class="inline-primary" data-action="diagnose" data-incident-id="${escapeHtml(item.incident_id)}">${a.state === 'needs_diagnosis' ? 'Demander un diagnostic' : 'Actualiser l’analyse'}</button>` : ''}
      ${a.next_action === 'decisions' ? '<button class="inline-primary" data-action="decisions">Examiner la demande de collecte</button>' : ''}
      ${a.followup?.detail ? `<p class="hint" role="status">${escapeHtml(a.followup.detail)}</p>` : ''}
      <a class="vision-link" href="/ui/?incident=${encodeURIComponent(item.incident_id)}#incidents">Ouvrir le dossier dans Vision →</a>
    </section>`;
};

const profile = () => {
  if (state.pairing) return `<section class="section pairing"><h2 class="section-title">Association en attente</h2><p>Dans Vision, ouvrez <strong>Configuration → Compagnons</strong>, comparez le code et l’empreinte TLS, puis approuvez cet iPhone.</p><div class="pairing-code">${escapeHtml(state.pairing.verification_code)}</div><dl><dt>Empreinte TLS</dt><dd>${escapeHtml(state.pairing.tls_ca_sha256)}</dd><dt>Expiration</dt><dd>${formatDate(state.pairing.expires_at)}</dd></dl><button class="inline-primary" data-action="poll">J’ai approuvé l’association</button></section>`;
  if (!state.token) return connectionRequired();
  return `<section class="section"><h2 class="section-title">Profil</h2><div class="profile-state"><span class="status-dot"></span><div><strong>Session Shizune associée</strong><p>Identité : ${escapeHtml(state.deviceId)}</p></div></div><button class="inline-secondary" data-action="forget">Oublier la session sur cet iPhone</button><p class="hint">La révocation complète reste disponible dans Vision.</p></section>`;
};

const render = () => {
  const app = document.querySelector('#app');
  if (state.error) {
    app.innerHTML = `<section class="section error"><h2 class="section-title">Connexion indisponible</h2><p>${escapeHtml(state.error)}</p><button class="inline-primary" data-action="refresh">Réessayer</button></section>${state.view === 'profile' ? profile() : ''}`;
    return;
  }
  if (state.loading) {
    app.innerHTML = '<section class="section"><div class="empty">Connexion à Tsunade…</div></section>';
    return;
  }
  if (state.view === 'home') app.innerHTML = home();
  else if (state.view === 'incident') app.innerHTML = state.token ? incidentDetail() : connectionRequired();
  else if (state.view === 'incidents') app.innerHTML = state.token ? `<button class="inline-secondary" data-action="home">← L’essentiel</button><section class="section"><h2 class="section-title">Les sujets suivis</h2>${(state.summary?.attention ?? []).map(item => incidentCard(item)).join('')}</section>` : connectionRequired();
  else if (state.view === 'activity') app.innerHTML = state.token ? `<section class="section"><h2 class="section-title">Activité récente</h2><div class="activity-list">${activityRows(state.activity)}</div></section>` : connectionRequired();
  else if (state.view === 'decisions') app.innerHTML = state.token ? `${state.requests.length ? state.requests.map(requestCard).join('') : '<section class="section decision"><h2 class="section-title">Aucune autorisation en attente</h2><p>Aucune action ne demande actuellement votre accord. Les incidents suivis restent accessibles dans l’essentiel.</p><button class="inline-secondary" data-action="home">Voir les incidents</button></section>'}` : connectionRequired();
  else app.innerHTML = profile();
  if (state.notice) app.insertAdjacentHTML('afterbegin', `<p class="diagnosis-notice" role="status">${escapeHtml(state.notice)}</p>`);
  document.querySelectorAll('.nav-item').forEach(item => {
    const selected = item.dataset.view === (['incident', 'incidents'].includes(state.view) ? 'home' : state.view);
    item.classList.toggle('active', selected);
    item.setAttribute('aria-current', selected ? 'page' : 'false');
  });
};

const loadDashboard = async () => {
  if (!state.token) return;
  const [summary, requests, activity] = await Promise.all([
    apiRequest('/summary'), apiRequest('/requests'), apiRequest('/activity'),
  ]);
  state.summary = summary;
  state.requests = Array.isArray(requests.requests) ? requests.requests : [];
  state.activity = Array.isArray(activity.activity) ? activity.activity : [];
};

const refresh = async ({quiet = false} = {}) => {
  state.loading = !quiet;
  state.error = null;
  if (!quiet) render();
  try {
    await loadDashboard();
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
  }
};

const startPairing = async () => {
  state.error = null;
  try {
    const version = await fetch('./version.json', { cache: 'no-store' }).then(response => response.json());
    state.pairing = await apiRequest('/pairings', {
      method: 'POST', authenticated: false,
      body: { protocol_version: 1, device_id: state.deviceId, device_name: 'iPhone Shizune', platform: 'ios', app_version: version.version },
    });
    state.view = 'profile';
  } catch (error) {
    state.error = error.message;
  }
  render();
};

const pollPairing = async () => {
  if (!state.pairing) return;
  try {
    const result = await apiRequest(`/pairings/${encodeURIComponent(state.pairing.pairing_id)}/poll`, {
      method: 'POST', authenticated: false,
      body: { protocol_version: 1, polling_secret: state.pairing.polling_secret },
    });
    if (!result.companion_token) {
      state.error = result.status === 'REJECTED' ? 'L’association a été refusée dans Vision.' : 'L’association n’est pas encore approuvée.';
      render();
      return;
    }
    await saveToken(result.companion_token);
    state.token = result.companion_token;
    state.pairing = null;
    state.view = 'home';
    await refresh();
  } catch (error) {
    state.error = error.message;
    render();
  }
};

const respond = async button => {
  state.busy = true;
  button.disabled = true;
  try {
    await apiRequest(`/requests/${encodeURIComponent(button.dataset.requestId)}/response`, {
      method: 'POST', body: { choice: button.dataset.choice },
    });
    await refresh();
  } catch (error) {
    state.error = error.message;
    render();
  } finally {
    state.busy = false;
  }
};

document.querySelector('#app').addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'pair') await startPairing();
  else if (button.dataset.action === 'poll') await pollPairing();
  else if (button.dataset.action === 'respond') await respond(button);
  else if (button.dataset.action === 'refresh') await refresh();
  else if (button.dataset.action === 'incident') {
    state.incidentId = button.dataset.incidentId;
    state.view = 'incident'; state.notice = null; render();
  }
  else if (['home', 'decisions', 'incidents'].includes(button.dataset.action)) {
    state.view = button.dataset.action; state.notice = null; render();
  }
  else if (button.dataset.action === 'diagnose') {
    state.busy = true;
    button.disabled = true;
    try {
      const result = await apiRequest(`/incidents/${encodeURIComponent(button.dataset.incidentId)}/diagnose`, {method: 'POST', body: {}});
      state.notice = result.status === 'AI_QUEUED' ? 'Diagnostic demandé à Katsuyu.' : result.status === 'DETERMINISTIC' ? 'Tsunade a actualisé sa conclusion.' : 'Le diagnostic manque encore d’éléments pour aboutir.';
      await refresh();
    } catch (error) {
      state.notice = `Diagnostic non confirmé : ${error.message}`;
      render();
    } finally {
      state.busy = false;
    }
  }
  else if (button.dataset.action === 'forget') {
    await vaultDelete('companion-token');
    state.token = null;
    state.summary = null;
    state.requests = [];
    state.activity = [];
    render();
  }
});

document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item === button));
  state.view = button.dataset.view;
  state.error = null;
  state.notice = null;
  render();
}));

const initialize = async () => {
  state.deviceId = deviceId();
  state.token = await loadToken();
  await refresh();
};

void initialize();
setInterval(() => {
  if (state.token && !document.hidden && !state.loading && !state.busy && state.view !== 'profile') void refresh({quiet: true});
}, 30000);
if (window.isSecureContext && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
