// Toutes les données restent en local (localStorage), rien n'est envoyé à un serveur.

const STORAGE_KEYS = {
  entries: 'rdr_entries',
  contacts: 'rdr_contacts'
};

const state = {
  entries: [],
  contacts: [],
  pendingEntry: null // utilisé le temps de gérer un avertissement d'interaction
};

// crypto.randomUUID() exige un contexte sécurisé (HTTPS ou localhost) : il est
// indisponible quand l'app est chargée via une IP locale en HTTP (ex. test sur
// téléphone via le réseau Wi-Fi). On retombe alors sur crypto.getRandomValues,
// qui lui n'a pas cette restriction.
function generateId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (window.crypto && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return hex.slice(0, 4).join('') + '-' + hex.slice(4, 6).join('') + '-' +
    hex.slice(6, 8).join('') + '-' + hex.slice(8, 10).join('') + '-' + hex.slice(10, 16).join('');
}

function loadState() {
  try {
    state.entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.entries)) || [];
  } catch (e) {
    state.entries = [];
  }
  try {
    state.contacts = JSON.parse(localStorage.getItem(STORAGE_KEYS.contacts)) || [];
  } catch (e) {
    state.contacts = [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(state.entries));
}

function saveContacts() {
  localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(state.contacts));
}

// ---------- Navigation ----------

function showTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  document.querySelector('.nav-btn[data-tab="' + tabId + '"]').classList.add('active');
  if (tabId === 'accueil') renderHome();
  if (tabId === 'journal') renderJournal();
  if (tabId === 'infos') renderInfos();
  if (tabId === 'urgence') renderContacts();
}

// ---------- Formatage temps ----------

function formatElapsed(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return m + ' min';
  return h + 'h' + String(m).padStart(2, '0');
}

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ---------- Accueil : timers actifs ----------

function recentEntries(withinHours) {
  const cutoff = Date.now() - withinHours * 3600000;
  return state.entries.filter(e => e.timestamp >= cutoff).sort((a, b) => b.timestamp - a.timestamp);
}

function lastEntryPerSubstance(withinHours) {
  const recents = recentEntries(withinHours);
  const seen = new Map();
  for (const e of recents) {
    if (!seen.has(e.substanceId)) seen.set(e.substanceId, e);
  }
  return Array.from(seen.values());
}

// Convertit une quantité de type "1/4", "1/2 comprimé", "2 entiers" en nombre.
// Renvoie null si la quantité n'est pas exprimée sous cette forme (ex. "1 trait", "~0,5 g").
function parseQuantityFraction(label) {
  if (!label) return null;
  const s = label.trim().toLowerCase();
  let m = s.match(/^(\d+)\/(\d+)/);
  if (m) return parseInt(m[1], 10) / parseInt(m[2], 10);
  m = s.match(/^(\d+)\s*(entiers?|comprimés?)?$/);
  if (m) return parseInt(m[1], 10);
  return null;
}

function formatFraction(n) {
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  let fracStr = '';
  if (Math.abs(frac - 0.25) < 0.01) fracStr = '¼';
  else if (Math.abs(frac - 0.5) < 0.01) fracStr = '½';
  else if (Math.abs(frac - 0.75) < 0.01) fracStr = '¾';
  if (whole === 0 && fracStr) return fracStr;
  if (fracStr) return whole + ' ' + fracStr;
  return String(whole);
}

// Cumul des quantités "en portions" (fractions/entiers de pilule) pour une substance
// sur les dernières heures. Renvoie null si aucune quantité loggée n'est de ce type.
function accumulatedDoseFraction(substanceId, withinHours) {
  const entries = recentEntries(withinHours).filter(e => e.substanceId === substanceId);
  let total = 0;
  let hasParsed = false;
  entries.forEach(e => {
    const val = parseQuantityFraction(e.quantity);
    if (val !== null) {
      total += val;
      hasParsed = true;
    }
  });
  return hasParsed ? total : null;
}

function renderDoseProgress(total) {
  const pills = [];
  let remaining = total;
  while (remaining > 0.001 && pills.length < 6) {
    pills.push(Math.min(remaining, 1));
    remaining -= 1;
  }
  return '<div class="dose-progress">' +
    pills.map(f => '<span class="dose-pill"><span class="dose-pill-fill" style="width:' + Math.round(f * 100) + '%"></span></span>').join('') +
    '<span class="dose-progress-label">Cumul : ' + formatFraction(total) + '</span>' +
    '</div>';
}

// Intensifie la couleur d'une substance vers le rouge à mesure que le cumul de
// doses augmente, jusqu'à un seuil "critique" au-delà duquel elle n'évolue plus.
// 1,5 dose complète cumulée sur 24h est un choix indicatif de repère de prudence
// (à ajuster si besoin) : au-delà, la couleur reste au maximum d'intensité.
// La progression est accélérée (racine) pour que le changement soit très visible
// dès la 2e prise, plutôt que de rester subtil jusqu'au seuil.
const CRITICAL_DOSE_TOTAL = 1.5;

function doseIntensity(doseTotal) {
  if (!doseTotal) return 0;
  const t = Math.min(doseTotal / CRITICAL_DOSE_TOTAL, 1);
  return Math.pow(t, 0.55);
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function mixColors(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

function escalatedColor(baseColor, doseTotal) {
  if (!doseTotal) return baseColor;
  return mixColors(baseColor, '#ef4444', doseIntensity(doseTotal));
}

let expandedTimerNotes = new Set();

function renderHome() {
  const container = document.getElementById('active-timers');
  const heading = document.getElementById('active-timers-heading');
  const lasts = lastEntryPerSubstance(24);
  if (lasts.length === 0) {
    heading.hidden = true;
    container.innerHTML = '';
    return;
  }
  heading.hidden = false;
  container.innerHTML = lasts.map(e => {
    const sub = getSubstance(e.substanceId);
    const elapsedMs = Date.now() - e.timestamp;
    const minIntervalMs = sub.minIntervalMin * 60000;
    const remainingMs = minIntervalMs - elapsedMs;
    let statusClass = 'ok';
    let statusText = 'Délai minimum conseillé écoulé';
    if (remainingMs > 0) {
      statusClass = 'wait';
      statusText = 'Encore ' + formatElapsed(remainingMs) + ' avant le délai minimum conseillé';
    }
    const doseTotal = accumulatedDoseFraction(e.substanceId, 24);
    const isExpanded = expandedTimerNotes.has(e.substanceId);
    const intensity = doseIntensity(doseTotal);
    const cardColor = escalatedColor(sub.color, doseTotal);
    const cardTintPct = Math.round(16 + intensity * 46);
    return '<div class="timer-card" style="--sub-color:' + cardColor + '; --card-tint:' + cardTintPct + '%">' +
      '<div class="timer-card-head">' +
      '<button type="button" class="timer-card-title timer-toggle" data-substance-id="' + e.substanceId + '">' +
      substanceIconBadge(sub, 'sm') + '<strong>' + sub.name + '</strong>' +
      '<svg class="timer-toggle-chevron' + (isExpanded ? ' open' : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>' +
      '</button>' +
      '</div>' +
      '<div class="timer-elapsed">' + formatElapsed(elapsedMs) + ' <span class="muted">depuis la dernière prise</span></div>' +
      '<div class="timer-status ' + statusClass + '">' + statusText + '</div>' +
      (doseTotal !== null ? renderDoseProgress(doseTotal) : '') +
      (isExpanded ? '<div class="timer-note">' + sub.conseilRedose + '</div>' : '') +
      '</div>';
  }).join('');

  container.querySelectorAll('.timer-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.substanceId;
      if (expandedTimerNotes.has(id)) expandedTimerNotes.delete(id);
      else expandedTimerNotes.add(id);
      renderHome();
    });
  });
}

// ---------- Journal ----------

function renderJournal() {
  const container = document.getElementById('journal-list');
  const all = [...state.entries].sort((a, b) => b.timestamp - a.timestamp);
  if (all.length === 0) {
    container.innerHTML = '<p class="empty-state">Votre journal est vide.</p>';
    return;
  }
  container.innerHTML = all.map(e => {
    const sub = getSubstance(e.substanceId);
    return '<div class="journal-entry" style="--sub-color:' + sub.color + '">' +
      substanceIconBadge(sub, 'sm') +
      '<div class="journal-entry-body">' +
      '<strong>' + sub.name + '</strong>' +
      (e.quantity ? ' — ' + escapeHtml(e.quantity) : '') +
      '<div class="muted small">' + formatDateTime(e.timestamp) + '</div>' +
      (e.note ? '<div class="small">' + escapeHtml(e.note) + '</div>' : '') +
      '</div>' +
      '<button class="icon-btn delete-entry" data-id="' + e.id + '" aria-label="Supprimer">✕</button>' +
      '</div>';
  }).join('');
  container.querySelectorAll('.delete-entry').forEach(btn => {
    btn.addEventListener('click', () => {
      state.entries = state.entries.filter(e => e.id !== btn.dataset.id);
      saveEntries();
      renderJournal();
      renderHome();
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Infos substances ----------

function renderInfos() {
  const container = document.getElementById('infos-list');
  container.innerHTML = SUBSTANCES.map(sub => {
    return '<details class="info-card" style="--sub-color:' + sub.color + '">' +
      '<summary>' + substanceIconBadge(sub, 'sm') + '<strong>' + sub.name + '</strong> <span class="muted">— ' + sub.category + '</span></summary>' +
      '<div class="info-body">' +
      (sub.illustration ? '<img class="info-illustration" src="assets/illustrations/' + sub.illustration + '" alt="Illustration réduction des risques — ' + sub.name + '" loading="lazy">' : '') +
      '<p><strong>Durée des effets :</strong> ' + sub.dureeEffets + '</p>' +
      '<p><strong>Effets :</strong> ' + sub.effets + '</p>' +
      '<p><strong>Conseils :</strong> ' + sub.conseilRedose + '</p>' +
      '<p><strong>Signes d\'alerte :</strong> ' + sub.signesDanger + '</p>' +
      '<p><strong>Que faire :</strong> ' + sub.conduite + '</p>' +
      '</div>' +
      '</details>';
  }).join('');
}

// ---------- Urgence / contacts ----------

const AVATAR_COLORS = ['#38bdf8', '#f472b6', '#4ade80', '#facc15', '#a78bfa', '#fb7185', '#2dd4bf', '#818cf8'];

function avatarColorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialsFor(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ? parts[0][0] : '';
  const second = parts[1] ? parts[1][0] : '';
  return (first + second).toUpperCase();
}

function renderContacts() {
  const container = document.getElementById('contacts-list');
  if (state.contacts.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucun contact de confiance enregistré.</p>';
  } else {
    container.innerHTML = state.contacts.map(c => {
      const color = avatarColorFor(c.name);
      return '<div class="contact-row">' +
        '<span class="avatar" style="background:' + color + '22;color:' + color + '">' + escapeHtml(initialsFor(c.name)) + '</span>' +
        '<a class="contact-call" href="tel:' + encodeURIComponent(c.phone) + '">' + escapeHtml(c.name) + '</a>' +
        '<button class="icon-btn delete-contact" data-id="' + c.id + '" aria-label="Supprimer">✕</button>' +
        '</div>';
    }).join('');
    container.querySelectorAll('.delete-contact').forEach(btn => {
      btn.addEventListener('click', () => {
        state.contacts = state.contacts.filter(c => c.id !== btn.dataset.id);
        saveContacts();
        renderContacts();
      });
    });
  }
}

function addContact(name, phone) {
  state.contacts.push({ id: generateId(), name, phone });
  saveContacts();
  renderContacts();
}

// ---------- Formulaire nouvelle prise ----------

let selectedSubstanceId = null;
let selectedQuantity = '';
let selectedTimeOffsetMin = 0;

function openNewEntryModal() {
  const modal = document.getElementById('modal-new-entry');
  selectedSubstanceId = null;
  selectedQuantity = '';
  selectedTimeOffsetMin = 0;

  const picker = document.getElementById('substance-picker');
  picker.innerHTML = SUBSTANCES.map(s => {
    return '<button type="button" class="substance-option" data-id="' + s.id + '" style="--sub-color:' + s.color + '">' +
      substanceIconBadge(s, 'lg') +
      '<span>' + s.name + '</span>' +
      '</button>';
  }).join('');
  picker.querySelectorAll('.substance-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSubstanceId = btn.dataset.id;
      picker.querySelectorAll('.substance-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('substance-picker-error').hidden = true;
      renderQuantityPicker(btn.dataset.id);
    });
  });

  document.getElementById('quantity-section').hidden = true;
  document.getElementById('quantity-picker').innerHTML = '';

  renderTimePicker();

  document.getElementById('input-note').hidden = true;
  document.getElementById('input-note').value = '';
  document.getElementById('btn-toggle-note').textContent = '+ Ajouter une note (optionnel)';

  modal.classList.add('open');
}

function renderQuantityPicker(substanceId) {
  const section = document.getElementById('quantity-section');
  const container = document.getElementById('quantity-picker');
  const presets = QUANTITY_PRESETS[substanceId] || [];
  selectedQuantity = '';
  if (presets.length === 0) {
    section.hidden = true;
    container.innerHTML = '';
    return;
  }
  section.hidden = false;
  container.innerHTML = presets.map(label => {
    return '<button type="button" class="chip" data-value="' + escapeHtml(label) + '">' + label + '</button>';
  }).join('');
  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const isSame = chip.classList.contains('selected');
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      if (!isSame) {
        chip.classList.add('selected');
        selectedQuantity = chip.dataset.value;
      } else {
        selectedQuantity = '';
      }
    });
  });
}

function renderTimePicker() {
  const container = document.getElementById('time-picker');
  container.innerHTML = TIME_PRESETS.map(t => {
    return '<button type="button" class="chip" data-offset="' + t.offsetMin + '">' + t.label + '</button>';
  }).join('');
  container.querySelectorAll('.chip').forEach((chip, idx) => {
    if (idx === 0) chip.classList.add('selected');
    chip.addEventListener('click', () => {
      selectedTimeOffsetMin = Number(chip.dataset.offset);
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
  });
}

function closeModal(modal) {
  modal.classList.remove('open');
}

function handleNewEntrySubmit(evt) {
  evt.preventDefault();
  if (!selectedSubstanceId) {
    document.getElementById('substance-picker-error').hidden = false;
    return;
  }
  const substanceId = selectedSubstanceId;
  const quantity = selectedQuantity;
  const note = document.getElementById('input-note').hidden ? '' : document.getElementById('input-note').value.trim();
  const timestamp = Date.now() - selectedTimeOffsetMin * 60000;

  const entry = { id: generateId(), substanceId, quantity, note, timestamp };

  const warnings = findInteractionWarnings(entry);
  if (warnings.length > 0) {
    state.pendingEntry = entry;
    showInteractionWarning(warnings);
  } else {
    commitEntry(entry);
  }
}

function findInteractionWarnings(entry) {
  const recents = recentEntries(24).filter(e => e.substanceId !== entry.substanceId);
  const warnings = [];
  const seenSubstances = new Set();
  for (const e of recents) {
    if (seenSubstances.has(e.substanceId)) continue;
    seenSubstances.add(e.substanceId);
    const interaction = checkInteraction(entry.substanceId, e.substanceId);
    if (interaction) {
      warnings.push({
        withSubstance: getSubstance(e.substanceId).name,
        level: interaction.level,
        message: interaction.message
      });
    }
  }
  // trier : danger d'abord
  const order = { danger: 0, risque: 1, prudence: 2 };
  warnings.sort((a, b) => order[a.level] - order[b.level]);
  return warnings;
}

function showInteractionWarning(warnings) {
  const modal = document.getElementById('modal-warning');
  const body = document.getElementById('warning-body');
  body.innerHTML = warnings.map(w => {
    const labels = { danger: '⚠️ Danger', risque: '⚠️ Risque élevé', prudence: 'ℹ️ Prudence' };
    return '<div class="warning-item ' + w.level + '">' +
      '<div class="warning-label">' + labels[w.level] + ' — avec ' + escapeHtml(w.withSubstance) + '</div>' +
      '<div>' + w.message + '</div>' +
      '</div>';
  }).join('');
  document.getElementById('modal-new-entry').classList.remove('open');
  modal.classList.add('open');
}

function commitEntry(entry) {
  state.entries.push(entry);
  saveEntries();
  document.getElementById('modal-new-entry').classList.remove('open');
  document.getElementById('modal-warning').classList.remove('open');
  state.pendingEntry = null;
  showTab('accueil');
  triggerSaveAnimation();
}

function triggerSaveAnimation() {
  const btn = document.getElementById('btn-new-entry');
  if (!btn) return;
  const label = btn.querySelector('.btn-cta-label');
  const originalText = label.textContent;

  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('div');
  ripple.className = 'save-ripple';
  ripple.style.left = (rect.left + rect.width / 2) + 'px';
  ripple.style.top = (rect.top + rect.height / 2) + 'px';
  document.body.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());

  btn.classList.add('btn-success');
  label.textContent = 'Conso enregistrée ✓';
  setTimeout(() => {
    btn.classList.remove('btn-success');
    label.textContent = originalText;
  }, 1400);
}

// ---------- Timer auto-refresh ----------

setInterval(() => {
  const homeTab = document.getElementById('tab-accueil');
  if (homeTab.classList.contains('active')) renderHome();
}, 30000);

// ---------- Init ----------

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  showTab('accueil');

  document.getElementById('btn-splash-start').addEventListener('click', () => {
    document.getElementById('splash-screen').classList.add('splash-exit');
  });

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  document.getElementById('btn-new-entry').addEventListener('click', openNewEntryModal);
  document.getElementById('form-new-entry').addEventListener('submit', handleNewEntrySubmit);
  document.getElementById('btn-cancel-entry').addEventListener('click', () => closeModal(document.getElementById('modal-new-entry')));

  document.getElementById('btn-warning-back').addEventListener('click', () => {
    closeModal(document.getElementById('modal-warning'));
    state.pendingEntry = null;
    openNewEntryModal();
  });
  document.getElementById('btn-warning-continue').addEventListener('click', () => {
    if (state.pendingEntry) commitEntry(state.pendingEntry);
  });

  document.getElementById('btn-toggle-note').addEventListener('click', () => {
    const noteInput = document.getElementById('input-note');
    noteInput.hidden = !noteInput.hidden;
    document.getElementById('btn-toggle-note').textContent = noteInput.hidden ? '+ Ajouter une note (optionnel)' : 'Masquer la note';
    if (!noteInput.hidden) noteInput.focus();
  });

  document.getElementById('form-new-contact').addEventListener('submit', evt => {
    evt.preventDefault();
    const name = document.getElementById('input-contact-name').value.trim();
    const phone = document.getElementById('input-contact-phone').value.trim();
    if (name && phone) {
      addContact(name, phone);
      evt.target.reset();
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
