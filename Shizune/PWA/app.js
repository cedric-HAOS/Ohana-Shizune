const activity = [
  ['▤', 'Analyse des logs', 'OK'], ['◎', 'Santé DNS-Primaire', 'OK'], ['◷', 'Dernière sauvegarde', '02:14'], ['⌁', 'Supervision réseau', 'stable']
];

const home = () => `
  <section class="section"><h2 class="section-title">État général</h2><div class="health"><div class="health-badge">✓</div><div><h2>Konoha : Stable</h2><p>INFRA-01 opérationnel<br>· Shikamaru <span class="ok">OK</span> · Tsunade <span class="ok">active</span></p></div><span class="chevron">›</span></div></section>
  <section class="section"><h2 class="section-title"><span class="section-icon">◉</span>Tsunade</h2><div class="message"><div class="avatar"><img src="./tsunade.png" alt="Tsunade" /></div><div><strong>Sauvegarde de INFRA-01<br>terminée.<br>Vérifier le rapport ?</strong></div><button class="dots" aria-label="Plus d'options">•••</button></div><div class="actions"><button data-action="later">Plus tard</button><button class="primary" data-action="report">Voir</button></div></section>
  <section class="section decision"><h2 class="section-title"><span class="section-icon">⚖</span>Décision requise</h2><div class="decision-copy"><span class="shield">♢</span><p>Autoriser le réveil de Bubule<br>pour l’analyse nocturne ?</p></div><div class="actions"><button class="danger" data-action="refuse">Refuser</button><button class="blue" data-action="authorize">Autoriser</button></div></section>
  <section class="section"><h2 class="section-title"><span class="section-icon">⌁</span>Activité récente</h2><div class="activity-list">${activity.map(row => `<div class="activity-row"><span>${row[0]}</span><span>${row[1]}</span><time>${row[2]}</time></div>`).join('')}</div></section>
  <section class="section incident"><h2 class="section-title"><span>♧</span>Incidents</h2><div class="message"><span class="health-badge" style="width:24px;height:24px;flex-basis:24px;font-size:1rem">✓</span><p>Aucun incident critique</p></div></section>`;

const render = view => {
  const app = document.querySelector('#app');
  if (view === 'home') app.innerHTML = home();
  else if (view === 'activity') app.innerHTML = `<section class="section"><h2 class="section-title">Activité récente</h2><div class="activity-list">${activity.concat([['✓', 'Dernière synchronisation', 'à l’instant']]).map(row => `<div class="activity-row"><span>${row[0]}</span><span>${row[1]}</span><time>${row[2]}</time></div>`).join('')}</div></section>`;
  else if (view === 'decisions') app.innerHTML = `<section class="section decision"><h2 class="section-title">Décisions requises</h2><div class="empty">Tsunade n’a pas d’autre demande en attente.</div></section>`;
  else app.innerHTML = `<section class="section"><h2 class="section-title">Profil</h2><div class="empty">Session Shizune associée à Konoha.<br><br><small>La connexion API sera branchée dans la prochaine tranche.</small></div></section>`;
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const labels = { later: 'Demande reportée.', report: 'Rapport bientôt disponible.', refuse: 'Réponse « Refuser » enregistrée.', authorize: 'Réponse « Autoriser » enregistrée.' };
    button.closest('.section').querySelector('.message strong')?.replaceChildren(document.createTextNode(labels[button.dataset.action]));
    button.closest('.actions').remove();
  }));
};

document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item === button)); render(button.dataset.view);
}));
render('home');
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
