const API_ROOT = '/api/shizune';
const DATABASE_NAME = 'ohana-shizune';
const STORE_NAME = 'secrets';
const DEVICE_ID_KEY = 'ohana-shizune-device-id';

const state = {
  view: 'home', deviceId: null, token: null, pairing: null,
  summary: null, requests: [], activity: [], loading: true, error: null,
};

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

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
  <h2 class="section-title"><span class="section-icon">⚖</span>Décision requise</h2>
  <div class="decision-copy"><span class="shield">♢</span><div><p>${escapeHtml(request.question)}</p><small>${escapeHtml(request.context)}</small></div></div>
  <div class="actions request-actions">${request.choices.map(choice => `<button class="${choice === 'AUTHORIZE' ? 'blue' : choice === 'REFUSE' ? 'danger' : ''}" data-action="respond" data-request-id="${escapeHtml(request.request_id)}" data-choice="${escapeHtml(choice)}">${{ AUTHORIZE: 'Autoriser', REFUSE: 'Refuser', LATER: 'Plus tard', CONFIRM: 'Confirmer' }[choice] ?? escapeHtml(choice)}</button>`).join('')}</div>
</section>`;

const connectionRequired = () => `<section class="section"><h2 class="section-title">Connexion à Konoha</h2><div class="empty">Shizune doit être associée à Tsunade avant d’afficher l’état réel.<br><button class="inline-primary" data-action="pair">Associer cet iPhone</button></div></section>`;

const home = () => {
  if (!state.token) return connectionRequired();
  if (!state.summary) return '<section class="section"><div class="empty">Synchronisation avec Tsunade…</div></section>';
  const [label, symbol, className] = healthPresentation(state.summary);
  const request = state.requests[0];
  return `
    <section class="section"><h2 class="section-title">État général</h2><div class="health ${className}"><div class="health-badge">${symbol}</div><div><h2>${label}</h2><p>${escapeHtml(state.summary.tsunade_message)}<br>Dernière analyse : ${formatDate(state.summary.last_checked_at)}</p></div></div></section>
    <section class="section"><h2 class="section-title"><span class="section-icon">◉</span>Tsunade</h2><div class="message"><div class="avatar"><img src="./tsunade.png" alt="Tsunade" /></div><div><strong>${escapeHtml(state.summary.tsunade_message)}</strong></div></div></section>
    ${request ? requestCard(request) : ''}
    <section class="section"><h2 class="section-title"><span class="section-icon">⌁</span>Activité récente</h2><div class="activity-list">${activityRows(state.activity.slice(0, 4))}</div></section>
    <section class="section incident"><h2 class="section-title"><span>♧</span>Incidents</h2><div class="message"><span class="health-badge small">${state.summary.attention?.length ? '!' : '✓'}</span><p>${state.summary.attention?.length ? `${state.summary.attention.length} incident(s) nécessitent une attention` : 'Aucun incident actif'}</p></div></section>`;
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
  else if (state.view === 'activity') app.innerHTML = state.token ? `<section class="section"><h2 class="section-title">Activité récente</h2><div class="activity-list">${activityRows(state.activity)}</div></section>` : connectionRequired();
  else if (state.view === 'decisions') app.innerHTML = state.token ? `${state.requests.length ? state.requests.map(requestCard).join('') : '<section class="section decision"><h2 class="section-title">Décisions requises</h2><div class="empty">Tsunade n’a aucune demande en attente.</div></section>'}` : connectionRequired();
  else app.innerHTML = profile();
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

const refresh = async () => {
  state.loading = true;
  state.error = null;
  render();
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
  button.disabled = true;
  try {
    await apiRequest(`/requests/${encodeURIComponent(button.dataset.requestId)}/response`, {
      method: 'POST', body: { choice: button.dataset.choice },
    });
    await refresh();
  } catch (error) {
    state.error = error.message;
    render();
  }
};

document.querySelector('#app').addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'pair') await startPairing();
  else if (button.dataset.action === 'poll') await pollPairing();
  else if (button.dataset.action === 'respond') await respond(button);
  else if (button.dataset.action === 'refresh') await refresh();
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
  render();
}));

const initialize = async () => {
  state.deviceId = deviceId();
  state.token = await loadToken();
  await refresh();
};

void initialize();
if (window.isSecureContext && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
