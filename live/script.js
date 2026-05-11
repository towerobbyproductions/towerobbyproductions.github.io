const CONFIG = {
  DEFAULT_ID: '10108284887',
  REFRESH_INTERVAL: 25000,
  CACHE_KEY: 'live_roblox_stats_theme'
};

const state = {
  mode: 'universeId',
  currentId: CONFIG.DEFAULT_ID,
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
  input: document.getElementById('gameIdInput'),
  searchBtn: document.getElementById('searchBtn'),
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
  el.input.value = CONFIG.DEFAULT_ID;
  el.converterInput.value = '83471552202911';
  el.refreshInfo.textContent = `${Math.round(CONFIG.REFRESH_INTERVAL / 1000)}s`;

  loadGame(CONFIG.DEFAULT_ID, true);
  state.timer = setInterval(() => {
    if (!state.isLoading && state.currentId) {
      loadGame(state.currentId, false);
    }
  }, CONFIG.REFRESH_INTERVAL);
}

function bindEvents() {
  el.themeToggle.addEventListener('click', toggleTheme);

  el.searchBtn.addEventListener('click', () => {
    const value = normalizeId(el.input.value);
    if (!value) {
      setMessage('Enter a valid numeric ID.', true);
      return;
    }
    loadGame(value, true);
  });

  el.refreshBtn.addEventListener('click', () => {
    if (!state.currentId) return;
    loadGame(state.currentId, false);
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

  el.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.searchBtn.click();
  });

  el.converterInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.convertBtn.click();
  });
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
  el.searchBtn.disabled = isLoading;
  el.refreshBtn.disabled = isLoading;
  el.input.disabled = isLoading;
  el.searchBtn.textContent = isLoading ? '...' : 'Load';
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

async function loadGame(inputId, manual = false) {
  const id = normalizeId(inputId);
  if (!id) return;

  if (manual) {
    state.currentId = id;
    el.input.value = id;
  }

  setLoading(true);
  setMessage(manual ? 'Loading live data…' : 'Updating live data…');
  el.resolvedId.textContent = id;

  try {
    const resolved = await resolveGame(id);
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

async function resolveGame(id) {
  const universeData = await fetchUniverseDetails(id);
  if (universeData) {
    return {
      mode: 'universeId',
      sourceId: id,
      universeId: String(universeData.universeId || id),
      placeId: String(universeData.rootPlaceId || universeData.placeId || id),
      basic: universeData
    };
  }

  const placeData = await fetchPlaceDetails(id);
  if (placeData) {
    const universeId = String(placeData.universeId || placeData.UniverseId || '');
    return {
      mode: 'placeId',
      sourceId: id,
      universeId: universeId || id,
      placeId: String(placeData.placeId || placeData.PlaceId || id),
      basic: placeData
    };
  }

  return null;
}

async function fetchUniverseDetails(universeId) {
  try {
    const res = await fetch(`https://games.roproxy.com/v1/games?universeIds=${encodeURIComponent(universeId)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data[0] : json?.data?.[0] || json?.data || null;
  } catch {
    return null;
  }
}

async function fetchPlaceDetails(placeId) {
  const endpoints = [
    `https://apis.roblox.com/universes/v1/places/${encodeURIComponent(placeId)}/universe`,
    `https://games.roproxy.com/v1/games/multiget-place-details?placeIds=${encodeURIComponent(placeId)}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const json = await res.json();

      if (json?.universeId) return { universeId: json.universeId, placeId };

      const item = Array.isArray(json) ? json[0] : json?.data?.[0] || json?.data || json || null;
      if (item) return item;
    } catch {}
  }

  return null;
}

async function convertPlaceToUniverse(placeId) {
  el.convertedResult.textContent = '...';
  el.converterNote.textContent = 'Resolving universeId…';

  const details = await fetchPlaceDetails(placeId);
  if (!details || !details.universeId) {
    el.convertedResult.textContent = '—';
    el.converterNote.textContent = 'Could not resolve this placeId.';
    return;
  }

  el.convertedResult.textContent = String(details.universeId);
  el.converterNote.textContent = `Resolved from placeId ${placeId}.`;
  el.input.value = String(details.universeId);
  await loadGame(String(details.universeId), true);
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
  const urls = [
    `https://games.roproxy.com/v1/games/votes?universeIds=${encodeURIComponent(universeId)}`,
    `https://games.roproxy.com/v1/games/${encodeURIComponent(universeId)}/votes`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const json = await res.json();
      const item = Array.isArray(json?.data) ? json.data[0] : json?.data || json;
      if (item) return item;
    } catch {}
  }

  return null;
}

async function fetchIcon(universeId) {
  try {
    const res = await fetch(`https://thumbnails.roproxy.com/v1/games/icons?universeIds=${encodeURIComponent(universeId)}&size=512x512&format=Png`, { cache: 'no-store' });
    if (!res.ok) return '';
    const json = await res.json();
    return json?.data?.[0]?.imageUrl || '';
  } catch {
    return '';
  }
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
