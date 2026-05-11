const CONFIG = {
  DEFAULT_PLACE_ID: '83471552202911',
  DEFAULT_UNIVERSE_ID: '10108284887',
  REFRESH_INTERVAL: 25000,
  CACHE_KEY: 'live_roblox_stats_theme',
  APPS_SCRIPT_URL: 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'
};

const state = {
  mode: 'placeId',
  currentId: CONFIG.DEFAULT_PLACE_ID,
  currentData: null,
  currentTheme: localStorage.getItem(CONFIG.CACHE_KEY) || 'dark',
  timer: null,
  isLoading: false,
  lastActive: null,
  lastVisits: null
};

const el = {
  html: document.documentElement,
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.getElementById('themeIcon'),
  themeLabel: document.getElementById('themeLabel'),
  placeIdInput: document.getElementById('placeIdInput'),
  universeIdInput: document.getElementById('universeIdInput'),
  loadPlaceBtn: document.getElementById('loadPlaceBtn'),
  loadUniverseBtn: document.getElementById('loadUniverseBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  converterInput: document.getElementById('converterInput'),
  convertBtn: document.getElementById('convertBtn'),
  convertedResult: document.getElementById('convertedResult'),
  converterNote: document.getElementById('converterNote'),
  resolvedMode: document.getElementById('resolvedMode'),
  resolvedId: document.getElementById('resolvedId'),
  refreshInfo: document.getElementById('refreshInfo'),
  lastUpdated: document.getElementById('lastUpdated'),
  gameThumb: document.getElementById('gameThumb'),
  gameKicker: document.getElementById('gameKicker'),
  gameTitle: document.getElementById('gameTitle'),
  gameDescription: document.getElementById('gameDescription'),
  priceBadge: document.getElementById('priceBadge'),
  gameActive: document.getElementById('gameActive'),
  gameVisits: document.getElementById('gameVisits'),
  gameRating: document.getElementById('gameRating'),
  gameMaxPlayers: document.getElementById('gameMaxPlayers'),
  gameCreator: document.getElementById('gameCreator'),
  gameGenre: document.getElementById('gameGenre'),
  universeIdValue: document.getElementById('universeIdValue'),
  placeIdValue: document.getElementById('placeIdValue'),
  playLink: document.getElementById('playLink'),
  messageBox: document.getElementById('messageBox'),
  activeCard: document.getElementById('activeCard'),
  activeChange: document.getElementById('activeChange'),
  gameShell: document.getElementById('gameShell')
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  applyTheme(state.currentTheme);
  bindEvents();

  el.placeIdInput.value = CONFIG.DEFAULT_PLACE_ID;
  el.universeIdInput.value = '';
  el.converterInput.value = CONFIG.DEFAULT_PLACE_ID;
  el.refreshInfo.textContent = `${Math.round(CONFIG.REFRESH_INTERVAL / 1000)}s`;

  if (!isAppsScriptConfigured()) {
    setMessage('Paste your Google Apps Script Web App URL in script.js first.', true);
  } else {
    loadGame(CONFIG.DEFAULT_PLACE_ID, true, 'placeId');
  }

  state.timer = setInterval(() => {
    if (!state.isLoading && state.currentId && isAppsScriptConfigured()) {
      loadGame(state.currentId, false, state.mode);
    }
  }, CONFIG.REFRESH_INTERVAL);
}

function bindEvents() {
  el.themeToggle.addEventListener('click', toggleTheme);

  el.loadPlaceBtn.addEventListener('click', () => {
    const value = normalizeId(el.placeIdInput.value);
    if (!value) {
      setMessage('Enter a valid Place ID.', true);
      return;
    }
    loadGame(value, true, 'placeId');
  });

  el.loadUniverseBtn.addEventListener('click', () => {
    const value = normalizeId(el.universeIdInput.value);
    if (!value) {
      setMessage('Enter a valid Universe ID.', true);
      return;
    }
    loadGame(value, true, 'universeId');
  });

  el.refreshBtn.addEventListener('click', () => {
    if (!state.currentId || !isAppsScriptConfigured()) return;
    loadGame(state.currentId, false, state.mode);
  });

  el.convertBtn.addEventListener('click', async () => {
    const value = normalizeId(el.converterInput.value);
    if (!value) {
      el.convertedResult.textContent = '—';
      el.converterNote.textContent = 'Enter a valid placeId.';
      return;
    }
    await convertPlaceToUniverse(value);
  });

  el.placeIdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.loadPlaceBtn.click();
  });

  el.universeIdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.loadUniverseBtn.click();
  });

  el.converterInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.convertBtn.click();
  });
}

function isAppsScriptConfigured() {
  return typeof CONFIG.APPS_SCRIPT_URL === 'string' &&
    CONFIG.APPS_SCRIPT_URL.includes('script.google.com/macros/s/') &&
    !CONFIG.APPS_SCRIPT_URL.includes('PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE');
}

function toggleTheme() {
  const next = state.currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(CONFIG.CACHE_KEY, next);
}

function applyTheme(theme) {
  state.currentTheme = theme;
  el.html.classList.toggle('light', theme === 'light');
  el.html.classList.toggle('dark', theme === 'dark');
  el.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  el.themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
}

function normalizeId(value) {
  const digits = String(value || '').replace(/\D+/g, '');
  return digits || '';
}

function formatNumber(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-US').format(num);
}

function formatCompact(num) {
  const n = Number(num || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function setLoading(isLoading) {
  state.isLoading = isLoading;
  el.gameShell.classList.toggle('refreshing', isLoading);
  document.body.classList.toggle('loading', isLoading);

  el.loadPlaceBtn.disabled = isLoading;
  el.loadUniverseBtn.disabled = isLoading;
  el.refreshBtn.disabled = isLoading;
  el.convertBtn.disabled = isLoading;

  el.placeIdInput.disabled = isLoading;
  el.universeIdInput.disabled = isLoading;
  el.converterInput.disabled = isLoading;

  el.loadPlaceBtn.textContent = isLoading ? '...' : 'Load place';
  el.loadUniverseBtn.textContent = isLoading ? '...' : 'Load universe';
  el.convertBtn.textContent = isLoading ? '...' : 'Convert';
}

function setMessage(text, error = false) {
  el.messageBox.textContent = text;
  el.gameShell.classList.toggle('error-state', Boolean(error));
}

function setUpdatedNow() {
  const now = new Date();
  el.lastUpdated.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function pulseActive(card, direction, diffText) {
  card.classList.remove('changed-up', 'changed-down', 'changed');
  void card.offsetWidth;
  card.classList.add('changed');
  if (direction === 'up') card.classList.add('changed-up');
  if (direction === 'down') card.classList.add('changed-down');
  el.activeChange.textContent = diffText;
  setTimeout(() => card.classList.remove('changed', 'changed-up', 'changed-down'), 800);
}

function buildAppsScriptUrl(action, id) {
  const url = CONFIG.APPS_SCRIPT_URL.trim();
  const separator = url.includes('?') ? '&' : '?';
  const callback = `cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return {
    callback,
    src: `${url}${separator}${new URLSearchParams({
      action,
      id: String(id),
      callback
    }).toString()}`
  };
}

function jsonpRequest(action, id) {
  return new Promise((resolve, reject) => {
    if (!isAppsScriptConfigured()) {
      reject(new Error('Apps Script URL is not configured'));
      return;
    }

    const { callback, src } = buildAppsScriptUrl(action, id);
    const script = document.createElement('script');
    let finished = false;

    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete window[callback]; } catch { window[callback] = undefined; }
    };

    const done = (value, isError = false) => {
      if (finished) return;
      finished = true;
      cleanup();
      if (isError) reject(value);
      else resolve(value);
    };

    window[callback] = (data) => done(data, false);
    script.onerror = () => done(new Error('Request failed'), true);

    const timeout = setTimeout(() => done(new Error('Request timed out'), true), 15000);
    const originalDone = done;
    const safeDone = (value, isError = false) => {
      clearTimeout(timeout);
      originalDone(value, isError);
    };
    window[callback] = (data) => safeDone(data, false);
    script.onerror = () => safeDone(new Error('Request failed'), true);

    script.src = src;
    document.body.appendChild(script);
  });
}

async function loadGame(inputId, manual = false, forcedMode = null) {
  const id = normalizeId(inputId);
  if (!id) return;

  if (manual) {
    state.currentId = id;
    state.mode = forcedMode || state.mode;
  }

  setLoading(true);
  setMessage(manual ? 'Loading live data…' : 'Updating live data…');
  el.resolvedId.textContent = id;

  try {
    const resolved = await resolveGame(id, forcedMode);
    if (!resolved) throw new Error('Game not found');

    const data = await fetchLiveData(resolved.universeId);

    state.currentId = resolved.sourceId;
    state.mode = resolved.mode;
    state.currentData = { ...resolved, ...data };

    renderGame(state.currentData);
    setUpdatedNow();
    setMessage(manual ? 'Game loaded successfully.' : 'Live data updated.');
  } catch (error) {
    console.error(error);
    setMessage('Could not load this game. Check the ID and try again.', true);
  } finally {
    setLoading(false);
  }
}

async function resolveGame(id, forcedMode = null) {
  if (forcedMode === 'universeId') {
    const universeData = await fetchUniverseDetails(id);
    return universeData ? {
      mode: 'universeId',
      sourceId: id,
      universeId: String(universeData.universeId || universeData.id || id),
      placeId: String(universeData.rootPlaceId || universeData.placeId || id),
      basic: universeData
    } : null;
  }

  if (forcedMode === 'placeId') {
    const placeData = await fetchPlaceDetails(id);
    return placeData ? {
      mode: 'placeId',
      sourceId: id,
      universeId: String(placeData.universeId || id),
      placeId: String(placeData.placeId || id),
      basic: placeData
    } : null;
  }

  const universeData = await fetchUniverseDetails(id);
  if (universeData) {
    return {
      mode: 'universeId',
      sourceId: id,
      universeId: String(universeData.universeId || universeData.id || id),
      placeId: String(universeData.rootPlaceId || universeData.placeId || id),
      basic: universeData
    };
  }

  const placeData = await fetchPlaceDetails(id);
  if (placeData) {
    return {
      mode: 'placeId',
      sourceId: id,
      universeId: String(placeData.universeId || id),
      placeId: String(placeData.placeId || id),
      basic: placeData
    };
  }

  return null;
}

async function fetchUniverseDetails(universeId) {
  const res = await jsonpRequest('universeDetails', universeId);
  if (!res || !res.ok) return null;
  return res.game || null;
}

async function fetchPlaceDetails(placeId) {
  const res = await jsonpRequest('resolvePlace', placeId);
  if (!res || !res.ok) return null;
  return {
    universeId: String(res.universeId || ''),
    placeId: String(res.placeId || placeId)
  };
}

async function convertPlaceToUniverse(placeId) {
  if (!isAppsScriptConfigured()) {
    el.convertedResult.textContent = '—';
    el.converterNote.textContent = 'Paste your Google Apps Script URL in script.js first.';
    return;
  }

  el.convertedResult.textContent = '...';
  el.converterNote.textContent = 'Resolving universeId…';

  try {
    const details = await fetchPlaceDetails(placeId);
    if (!details || !details.universeId) {
      el.convertedResult.textContent = '—';
      el.converterNote.textContent = 'Could not resolve this placeId.';
      return;
    }

    el.convertedResult.textContent = String(details.universeId);
    el.converterNote.textContent = `Resolved from placeId ${placeId}.`;
    el.universeIdInput.value = String(details.universeId);
    await loadGame(String(details.universeId), true, 'universeId');
  } catch (err) {
    el.convertedResult.textContent = '—';
    el.converterNote.textContent = 'Could not resolve this placeId.';
  }
}

async function fetchLiveData(universeId) {
  const [game, votes, icon] = await Promise.all([
    fetchUniverseDetails(universeId),
    fetchVotes(universeId),
    fetchIcon(universeId)
  ]);

  const visits = Number(game?.visits ?? game?.visitedCount ?? 0);
  const active = Number(game?.playing ?? game?.currentPlayers ?? 0);
  const rating = getRating(votes, game);
  const maxPlayers = Number(game?.maxPlayers ?? game?.MaxPlayers ?? 0);

  return {
    title: game?.name || game?.title || 'Untitled game',
    description: game?.description || 'No description available.',
    creator: game?.creator?.name || game?.creatorName || game?.Builder || 'Unknown',
    genre: game?.genre_l1 || game?.genre || game?.assetGenre || 'Unknown',
    visits,
    active,
    rating,
    maxPlayers,
    price: Number.isFinite(Number(game?.price)) ? Number(game.price) : 0,
    icon,
    universeId: String(game?.id || game?.universeId || universeId),
    placeId: String(game?.rootPlaceId || game?.placeId || state.currentData?.placeId || '')
  };
}

async function fetchVotes(universeId) {
  const res = await jsonpRequest('votes', universeId);
  if (!res || !res.ok) return null;
  return res.votes || null;
}

async function fetchIcon(universeId) {
  const res = await jsonpRequest('icon', universeId);
  if (!res || !res.ok) return '';
  return res.icon || '';
}

function getRating(votes, game) {
  const up = Number(votes?.upVotes ?? votes?.likes ?? votes?.positiveVotes);
  const down = Number(votes?.downVotes ?? votes?.dislikes ?? votes?.negativeVotes);

  if (Number.isFinite(up) && Number.isFinite(down)) {
    const total = up + down;
    if (total > 0) return Math.round((up / total) * 100);
  }

  const score = Number(game?.voting?.score);
  if (Number.isFinite(score)) return Math.round(score * 100);

  return null;
}

function renderGame(data) {
  const previousActive = state.lastActive;
  const previousVisits = state.lastVisits;

  state.lastActive = Number(data.active || 0);
  state.lastVisits = Number(data.visits || 0);

  el.resolvedMode.textContent = data.mode || 'universeId';
  el.resolvedId.textContent = data.universeId || state.currentId;
  el.gameKicker.textContent = data.mode === 'placeId' ? 'Resolved from placeId' : 'Live from universeId';
  el.gameTitle.textContent = data.title || 'Untitled game';
  el.gameDescription.textContent = data.description || 'No description available.';
  el.priceBadge.textContent = Number(data.price) > 0 ? `${data.price} Robux` : 'Free';
  el.gameActive.textContent = formatNumber(data.active);
  el.gameVisits.textContent = formatCompact(data.visits);
  el.gameRating.textContent = data.rating === null ? '—' : `${data.rating}%`;
  el.gameMaxPlayers.textContent = data.maxPlayers ? formatNumber(data.maxPlayers) : '—';
  el.gameCreator.textContent = data.creator || 'Unknown';
  el.gameGenre.textContent = data.genre || 'Unknown';
  el.universeIdValue.textContent = data.universeId || '—';
  el.placeIdValue.textContent = data.placeId || '—';

  const thumb = data.icon || '';
  if (thumb) {
    if (el.gameThumb.src !== thumb) {
      el.gameThumb.classList.remove('loaded');
      el.gameThumb.onload = () => el.gameThumb.classList.add('loaded');
      el.gameThumb.src = thumb;
    } else {
      el.gameThumb.classList.add('loaded');
    }
  }

  const playId = data.placeId || data.universeId || state.currentId;
  if (playId) {
    el.playLink.href = `https://www.roblox.com/games/${playId}`;
  }

  if (previousActive !== null && previousActive !== state.lastActive) {
    const diff = state.lastActive - previousActive;
    const diffText = `${diff >= 0 ? '+' : ''}${formatNumber(diff)}`;
    pulseActive(el.activeCard, diff >= 0 ? 'up' : 'down', diffText);
  } else if (previousVisits !== null && previousVisits !== state.lastVisits) {
    el.activeChange.textContent = 'updated';
    el.activeChange.style.display = 'inline-flex';
  } else {
    el.activeChange.textContent = 'stable';
    el.activeChange.style.display = 'inline-flex';
  }
}
