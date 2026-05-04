const CONFIG = {
  COMMUNITY_GROUP_ID: '102552180',
  CACHE_KEY: 'tower_obby_data',
  CACHE_DURATION: 300000,
  UPDATE_INTERVAL: 60000
};

// ✅ ДОБАВИЛИ НОВУЮ ИГРУ (пример — вставь свою)
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
  games: []
};

const elements = {
  gamesGrid: document.getElementById('gamesGrid'),
  communityMembers: document.getElementById('communityMembers'),
  communityGames: document.getElementById('communityGames')
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadAllData();
  setInterval(loadAllData, CONFIG.UPDATE_INTERVAL);
}

// =======================
// ЗАГРУЗКА
// =======================

async function loadAllData() {
  try {
    await Promise.all([
      loadGames(),
      loadCommunity()
    ]);
    renderGames();
  } catch (e) {
    console.error(e);
  }
}

async function loadGames() {
  const results = await Promise.all(
    EXPERIENCES.map(async (item) => {
      try {
        const res = await fetch(`https://games.roproxy.com/v1/games?universeIds=${item.universeId}`);
        const json = await res.json();
        const game = json?.data?.[0];

        const iconRes = await fetch(`https://thumbnails.roproxy.com/v1/games/icons?universeIds=${item.universeId}&size=512x512&format=Png`);
        const iconJson = await iconRes.json();

        return {
          fallback: item,
          game,
          icon: iconJson?.data?.[0]?.imageUrl || item.thumb
        };
      } catch {
        return {
          fallback: item,
          game: null,
          icon: item.thumb
        };
      }
    })
  );

  // ✅ НОРМАЛЬНАЯ ОБРАБОТКА
  state.games = results.map(r => {
    const g = r.game || {};
    const f = r.fallback;

    return {
      title: g.name || f.titleFallback,
      placeId: f.placeId,
      slug: f.slug,
      icon: r.icon,

      visits: Number(g.visits || f.fallbackVisits || 0),
      active: Number(g.playing || f.fallbackActive || 0),

      // ❗ ВАЖНО: если нет голосов → null
      rating: g.voting?.upVotes + g.voting?.downVotes > 0
        ? Math.round(g.voting.score * 100)
        : null,

      price: g.price ?? 0,

      genre1: g.genre_l1 || f.genreFallback1,
      genre2: g.genre_l2 || f.genreFallback2
    };
  })

  // ✅ СОРТИРОВКА ПО VISITS (главное)
  .sort((a, b) => b.visits - a.visits);
}

async function loadCommunity() {
  try {
    const res = await fetch(`https://groups.roproxy.com/v1/groups/${CONFIG.COMMUNITY_GROUP_ID}`);
    const data = await res.json();

    if (data?.memberCount && elements.communityMembers) {
      elements.communityMembers.textContent = formatNumber(data.memberCount);
    }

    if (elements.communityGames) {
      elements.communityGames.textContent = EXPERIENCES.length;
    }
  } catch {}
}

// =======================
// РЕНДЕР
// =======================

function renderGames() {
  if (!elements.gamesGrid) return;

  elements.gamesGrid.innerHTML = '';

  state.games.forEach((game, index) => {

    // ✅ РЕЙТИНГ
    const ratingText =
      game.rating === null
        ? 'New'
        : `${game.rating}%`;

    // ✅ ЦЕНА
    const priceText =
      game.price > 0
        ? `${game.price} Robux`
        : 'Free to play';

    const card = document.createElement('a');
    card.className = 'game-card';
    card.href = `https://towerobbydev.fun/games/${game.placeId}/${game.slug}/`;
    card.target = '_blank';

    card.innerHTML = `
      <div class="game-thumbnail-container">
        <div class="game-thumbnail-wrapper">
          <img src="${game.icon}" class="game-thumbnail">
        </div>
        <div class="game-badge">
          ${index === 0 ? '🔥 HOT' : '⭐'}
        </div>
      </div>

      <div class="game-info">
        <h3 class="game-title">${game.title}</h3>

        <div class="game-meta-row">
          <span class="game-price">💥 ${priceText}</span>
          <span class="game-rating">${ratingText}</span>
        </div>

        <div class="game-stats">
          <div class="stat-item">
            <span class="stat-label">Active</span>
            <span class="stat-value">${formatNumber(game.active)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Visits</span>
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

// =======================
// UTILS
// =======================

function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(n || 0);
}

function formatVisits(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}
