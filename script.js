const CONFIG = {
  COMMUNITY_GROUP_ID: '102552180',
  ROBLOX_USER_ID: '4828786884',
  CACHE_KEY: 'tower_obby_data',
  CACHE_DURATION: 300000,
  UPDATE_INTERVAL: 60000
};

const EXPERIENCES = [
  {
    titleFallback: 'HD Admin Chaos Tower',
    universeId: '9678437015',
    placeId: '71240146627158',
    slug: 'HD-Admin-Chaos-Tower',
    thumb: 'https://tr.rbxcdn.com/180DAY-0d89850eddf82db8a49293be85d3ae68/512/512/Image/Webp/noFilter',
    genreFallback1: 'Obby & Platformer',
    genreFallback2: 'Tower Obby',
    fallbackVisits: 855800,
    fallbackActive: 949
  },
  {
    titleFallback: '🎧 Keyboard Tower ASMR',
    universeId: '10108284887',
    placeId: '83471552202911',
    slug: 'Keyboard-Tower-ASMR',
    thumb: 'https://tr.rbxcdn.com/180DAY-ae236ac09db08e270ad769f16dda809a/512/512/Image/Webp/noFilter',
    genreFallback1: 'Obby & Platformer',
    genreFallback2: 'Tower Obby',
    fallbackVisits: 2130,
    fallbackActive: 0
  }
];

const state = {
  currentLang: localStorage.getItem('language') || 'en',
  currentTheme: localStorage.getItem('theme') || 'dark',
  games: [],
  community: null,
  isLoading: false
};

const elements = {
  themeToggle: document.getElementById('themeToggle'),
  langToggle: document.getElementById('langToggle'),
  themeIcon: document.querySelector('.theme-icon'),
  langText: document.querySelector('.lang-text'),
  gamesGrid: document.getElementById('gamesGrid'),
  communityMembers: document.getElementById('communityMembers'),
  communityGames: document.getElementById('communityGames'),
  communityCard: document.getElementById('communityCard'),
  communityName: document.getElementById('communityName'),
  communityAvatar: document.getElementById('communityAvatar'),
  ownerLink: document.getElementById('ownerLink'),
  viewCommunityBtn: document.getElementById('viewCommunityBtn'),
  viewCommunityPageBtn: document.getElementById('viewCommunityPageBtn')
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  loadSettings();
  setTheme(state.currentTheme);
  setLanguage(state.currentLang);
  setupEventListeners();
  await loadAllData();
  setInterval(loadAllData, CONFIG.UPDATE_INTERVAL);

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function loadSettings() {
  const savedTheme = localStorage.getItem('theme');
  const savedLang = localStorage.getItem('language');

  if (savedTheme === 'dark' || savedTheme === 'light') state.currentTheme = savedTheme;
  if (savedLang === 'ru' || savedLang === 'en') state.currentLang = savedLang;
}

function setTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
    html.classList.remove('light');
    if (elements.themeIcon) elements.themeIcon.textContent = '🌙';
  } else {
    html.classList.add('light');
    html.classList.remove('dark');
    if (elements.themeIcon) elements.themeIcon.textContent = '☀️';
  }
  state.currentTheme = theme;
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  setTheme(state.currentTheme === 'dark' ? 'light' : 'dark');
}

function setLanguage(lang) {
  state.currentLang = lang;
  document.documentElement.lang = lang;
  localStorage.setItem('language', lang);
  if (elements.langText) elements.langText.textContent = lang === 'ru' ? 'EN' : 'RU';

  document.querySelectorAll('[data-ru][data-en]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });
}

function toggleLanguage() {
  setLanguage(state.currentLang === 'ru' ? 'en' : 'ru');
  renderGames();
}

function setupEventListeners() {
  if (elements.themeToggle) elements.themeToggle.addEventListener('click', toggleTheme);
  if (elements.langToggle) elements.langToggle.addEventListener('click', toggleLanguage);
}

async function loadAllData() {
  if (state.isLoading) return;
  state.isLoading = true;

  try {
    await Promise.all([
      loadGames(),
      loadCommunityData()
    ]);
    renderGames();
    cacheData('games', state.games);
    cacheData('community', state.community);
  } catch (error) {
    console.error('Load error:', error);
    loadCachedData();
  } finally {
    state.isLoading = false;
  }
}

async function loadGames() {
  const results = await Promise.all(
    EXPERIENCES.map(async (item) => {
      try {
        const gameResponse = await fetch(`https://games.roproxy.com/v1/games?universeIds=${item.universeId}`, { cache: 'no-store' });
        const gameJson = gameResponse.ok ? await gameResponse.json() : null;
        const game = gameJson?.data?.[0] || null;

        const iconResponse = await fetch(`https://thumbnails.roproxy.com/v1/games/icons?universeIds=${item.universeId}&size=512x512&format=Png`, { cache: 'no-store' });
        const iconJson = iconResponse.ok ? await iconResponse.json() : null;
        const iconUrl = iconJson?.data?.[0]?.imageUrl || item.thumb;

        return {
          fallback: item,
          game,
          iconUrl
        };
      } catch (e) {
        return {
          fallback: item,
          game: null,
          iconUrl: item.thumb
        };
      }
    })
  );

  state.games = results
    .map(item => {
      const g = item.game || {};
      const fallback = item.fallback;

      const visits = Number(g.visits || fallback.fallbackVisits || 0);
      const active = Number(g.playing || fallback.fallbackActive || 0);

      return {
        title: g.name || fallback.titleFallback,
        placeId: fallback.placeId,
        slug: fallback.slug,
        iconUrl: item.iconUrl,
        price: g.price ?? null,
        rating: g.voting?.score ? Math.round(g.voting.score * 100) : null,
        active,
        visits,
        genre1: g.genre_l1 || g.genre || fallback.genreFallback1,
        genre2: g.genre_l2 || fallback.genreFallback2
      };
    })
    .sort((a, b) => b.visits - a.visits);
}

async function loadCommunityData() {
  try {
    const groupResponse = await fetch(`https://groups.roproxy.com/v1/groups/${CONFIG.COMMUNITY_GROUP_ID}`, { cache: 'no-store' });
    const groupData = groupResponse.ok ? await groupResponse.json() : null;
    state.community = groupData || null;

    if (groupData?.memberCount && elements.communityMembers) {
      elements.communityMembers.textContent = formatNumber(groupData.memberCount);
    }

    if (elements.communityGames) {
      elements.communityGames.textContent = String(EXPERIENCES.length);
    }

    if (groupData?.name && elements.communityName) {
      elements.communityName.textContent = groupData.name;
    }

    if (groupData?.description && document.getElementById('aboutSection')) {
      const p = document.querySelector('#aboutSection p');
      if (p) p.textContent = groupData.description;
    }

    if (elements.communityCard) {
      elements.communityCard.classList.add('data-updated');
      setTimeout(() => elements.communityCard.classList.remove('data-updated'), 600);
    }
  } catch (e) {
    if (elements.communityGames) elements.communityGames.textContent = String(EXPERIENCES.length);
  }
}

function renderGames() {
  if (!elements.gamesGrid) return;
  elements.gamesGrid.innerHTML = '';

  const sortedGames = [...state.games].sort((a, b) => b.visits - a.visits);

  sortedGames.forEach((game, index) => {
    const card = document.createElement('a');
    card.className = 'game-card';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.href = `https://towerobbydev.fun/games/${game.placeId}/${game.slug}/`;

    const ratingText = game.rating === null ? '—' : `${game.rating}%`;
    const priceText =
      game.price === null ? 'Free' :
      game.price === 0 ? 'Free' :
      `${game.price} Robux`;

    card.innerHTML = `
      <div class="game-thumbnail-container">
        <div class="game-thumbnail-wrapper">
          <img src="${game.iconUrl}" alt="${game.title}" class="game-thumbnail">
        </div>
        <div class="game-badge">${index === 0 ? '🔥 HOT' : '⭐ NEW'}</div>
      </div>
      <div class="game-info">
        <h3 class="game-title">${game.title}</h3>
        <div class="game-meta-row">
          <span class="game-price">💥 ${priceText}</span>
          <span class="game-rating">${ratingText}</span>
        </div>
        <div class="game-stats">
          <div class="stat-item">
            <span class="stat-label">${state.currentLang === 'ru' ? 'Активно' : 'Active'}</span>
            <span class="stat-value">${formatNumber(game.active)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">${state.currentLang === 'ru' ? 'Визитов' : 'Visits'}</span>
            <span class="stat-value">${formatVisits(game.visits)}</span>
          </div>
        </div>
        <div class="game-categories">
          <span class="category-tag">${game.genre1}</span>
          <span class="category-tag">${game.genre2}</span>
        </div>
      </div>
    `;

    elements.gamesGrid.appendChild(card);
  });
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(Number(num || 0));
}

function formatVisits(visits) {
  const n = Number(visits || 0);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function cacheData(key, data) {
  try {
    localStorage.setItem(`${CONFIG.CACHE_KEY}_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

function loadCachedData() {
  try {
    const gamesCache = localStorage.getItem(`${CONFIG.CACHE_KEY}_games`);
    const communityCache = localStorage.getItem(`${CONFIG.CACHE_KEY}_community`);

    if (gamesCache) {
      const parsed = JSON.parse(gamesCache);
      if (Date.now() - parsed.timestamp < CONFIG.CACHE_DURATION) {
        state.games = parsed.data || [];
        renderGames();
      }
    }

    if (communityCache) {
      const parsed = JSON.parse(communityCache);
      if (Date.now() - parsed.timestamp < CONFIG.CACHE_DURATION) {
        state.community = parsed.data || null;
      }
    }
  } catch (e) {
    console.error(e);
  }
}
