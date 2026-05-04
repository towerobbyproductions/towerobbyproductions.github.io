// config
const GROUP_ID = '102552180';

const EXPERIENCES = [
  {
    titleFallback: 'HD Admin Chaos Tower',
    universeId: '9678437015',
    placeId: '71240146627158',
    thumb: 'https://tr.rbxcdn.com/180DAY-0d89850eddf82db8a49293be85d3ae68/512/512/Image/Webp/noFilter',
    genreFallback1: 'Obby & Platformer',
    genreFallback2: 'Tower Obby'
  },
  {
    titleFallback: '🎧 Keyboard Tower ASMR',
    universeId: '10108284887',
    placeId: '83471552202911',
    thumb: 'https://tr.rbxcdn.com/180DAY-ae236ac09db08e270ad769f16dda809a/512/512/Image/Webp/noFilter',
    genreFallback1: 'Obby & Platformer',
    genreFallback2: 'Tower Obby'
  }
];

// Worker URL
const WORKER_URL = 'https://young-breeze-5b43.robloxtop1742.workers.dev';

// elements
const el = {
  about: document.getElementById('communityAbout'),
  members: document.getElementById('membersCount'),
  experiencesGrid: document.getElementById('experiencesGrid'),
  experiencesCount: document.getElementById('experiencesCount'),
  communityName: document.getElementById('communityName'),
  communityAvatar: document.getElementById('communityAvatar'),
  ownerLink: document.getElementById('ownerLink'),
  themeToggle: document.getElementById('themeToggle'),
  langToggle: document.getElementById('langToggle'),
  viewOnRoblox: document.getElementById('viewOnRoblox')
};

// I18N
const I18N = {
  en: {
    by: 'By',
    view_roblox: 'View Community in Roblox',
    about: 'About',
    experiences: 'Experiences',
    members_suffix: 'Members',
    loading_about: 'Loading about…',
    experience_singular: 'Experiences',
    active_suffix: 'active',
    visits_suffix: 'visits'
  },
  ru: {
    by: 'Автор',
    view_roblox: 'Открыть сообщество в Roblox',
    about: 'О нас',
    experiences: 'Игры',
    members_suffix: 'участников',
    loading_about: 'Загрузка описания…',
    experience_singular: 'Игры',
    active_suffix: 'активных',
    visits_suffix: 'посещений'
  }
};

let currentLang = localStorage.getItem('siteLang') || window.__SITE_LANG || 'en';
let liveGamesData = [];
let liveVotesData = [];

// translations
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.getAttribute('data-i18n');
    if (I18N[currentLang] && I18N[currentLang][key]) node.textContent = I18N[currentLang][key];
  });

  if (el.langToggle) el.langToggle.textContent = currentLang.toUpperCase();
  if (el.viewOnRoblox) el.viewOnRoblox.textContent = I18N[currentLang].view_roblox;
}
applyTranslations();

// theme
function getTheme() {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

function setTheme(t) {
  if (t === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }
  localStorage.setItem('theme', t);
  updateThemeButton();
}

function updateThemeButton() {
  if (!el.themeToggle) return;
  const cur = getTheme();
  el.themeToggle.textContent = cur === 'dark' ? '🌙' : '☀️';
  el.themeToggle.setAttribute('aria-pressed', cur === 'dark' ? 'true' : 'false');
}

(function initTheme() {
  const stored = localStorage.getItem('theme');
  const theme = stored || (document.documentElement.classList.contains('light') ? 'light' : 'dark');
  setTheme(theme);
})();

if (el.themeToggle) {
  el.themeToggle.addEventListener('click', () => {
    const now = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(now);
  });
}

// language
if (el.langToggle) {
  el.langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ru' : 'en';
    localStorage.setItem('siteLang', currentLang);
    document.documentElement.lang = currentLang;
    applyTranslations();
    renderAllExperienceCards();
  });
}

// helpers
function fmt(n) {
  return new Intl.NumberFormat().format(n || 0);
}

function setMembersText(value) {
  if (el.members) el.members.textContent = value;
}

if (el.about) el.about.textContent = I18N[currentLang].loading_about;
setMembersText('Loading…');

// fetch one game
async function fetchGameByUniverseId(universeId) {
  const url = `https://games.roproxy.com/v1/games?universeIds=${universeId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed game fetch: ${universeId}`);
  const json = await res.json();
  return json?.data?.[0] || null;
}

// fetch votes for one game
async function fetchVotesByUniverseId(universeId) {
  const url = `https://games.roproxy.com/v1/games/votes?universeIds=${universeId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed votes fetch: ${universeId}`);
  const json = await res.json();
  return json?.data?.[0] || null;
}

function getRatingPercent(votes) {
  const up = Number(votes?.upVotes || 0);
  const down = Number(votes?.downVotes || 0);
  const total = up + down;
  if (!total) return 0;
  return Math.round((up / total) * 100);
}

function createExperienceCard(g, votes, fallback) {
  const card = document.createElement('a');
  card.className = 'exp-card';
  card.href = `https://www.roblox.com/games/${fallback.placeId}/`;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  const thumb = document.createElement('img');
  thumb.src = g?.thumbnailUrl || fallback.thumb;
  thumb.alt = g?.name || fallback.titleFallback;
  thumb.className = 'exp-thumb';

  const info = document.createElement('div');
  info.className = 'exp-info';

  const title = document.createElement('div');
  title.className = 'exp-title';

  const priceStr =
    (g?.price && g.price > 0) ? ` [${g.price} Robux]` :
    (g?.price === 0 ? ' [Free]' : '');

  title.textContent = (g?.name || fallback.titleFallback) + priceStr;

  const playing = g?.playing || 0;
  const visits = g?.visits || 0;
  const ratingPercent = getRatingPercent(votes);

  const meta = document.createElement('div');
  meta.className = 'exp-meta mt-1';
  meta.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="exp-rating">${ratingPercent}%</span>
      <span>${fmt(playing)} ${I18N[currentLang].active_suffix}</span>
      <span>•</span>
      <span>${fmt(visits)} ${I18N[currentLang].visits_suffix}</span>
    </div>
    <div class="mt-1 text-sm">${g?.genre_l1 || g?.genre || fallback.genreFallback1} · ${g?.genre_l2 || fallback.genreFallback2}</div>
  `;

  info.appendChild(title);
  info.appendChild(meta);
  card.appendChild(thumb);
  card.appendChild(info);

  return card;
}

function renderAllExperienceCards() {
  if (!el.experiencesGrid) return;
  el.experiencesGrid.innerHTML = '';

  if (!liveGamesData.length) {
    const fallback = document.createElement('div');
    fallback.className = 'p-4 text-sm';
    fallback.textContent = 'Loading experiences…';
    el.experiencesGrid.appendChild(fallback);
    if (el.experiencesCount) el.experiencesCount.textContent = '0';
    return;
  }

  EXPERIENCES.forEach((fallback, index) => {
    const g = liveGamesData[index] || null;
    const votes = liveVotesData[index] || null;
    const card = createExperienceCard(g, votes, fallback);
    el.experiencesGrid.appendChild(card);
  });

  if (el.experiencesCount) {
    el.experiencesCount.textContent = `${EXPERIENCES.length} ${I18N[currentLang].experience_singular}`;
  }
}

// fetch community about / member count
(async function fetchGroup() {
  try {
    const res = await fetch(`${WORKER_URL}/group/${GROUP_ID}`, { method: 'GET' });
    if (!res.ok) throw new Error('group fetch failed: ' + res.status);

    const data = await res.json();

    const members =
      data.memberCount ??
      data.membersCount ??
      data.data?.memberCount ??
      data.data?.membersCount ??
      data.members ??
      data.count;

    const about = data.description || data.about;

    if (members !== undefined && members !== null) {
      setMembersText(`${fmt(members)} ${I18N[currentLang].members_suffix}`);
    } else {
      setMembersText(`65K+ ${I18N[currentLang].members_suffix}`);
    }

    if (about) {
      if (el.about) el.about.textContent = about;
    }
  } catch (e) {
    console.error(e);
    setMembersText(`65K+ ${I18N[currentLang].members_suffix}`);
  }
})();

// fetch all games + votes
(async function fetchExperiences() {
  try {
    if (el.experiencesGrid) {
      el.experiencesGrid.innerHTML = '';
      const loading = document.createElement('div');
      loading.className = 'p-4 text-sm';
      loading.textContent = 'Loading experiences…';
      el.experiencesGrid.appendChild(loading);
    }

    const [gamesResults, votesResults] = await Promise.all([
      Promise.all(EXPERIENCES.map(async (item) => {
        try {
          return await fetchGameByUniverseId(item.universeId);
        } catch (err) {
          console.error('Game fetch failed:', item.universeId, err);
          return null;
        }
      })),
      Promise.all(EXPERIENCES.map(async (item) => {
        try {
          return await fetchVotesByUniverseId(item.universeId);
        } catch (err) {
          console.error('Votes fetch failed:', item.universeId, err);
          return null;
        }
      }))
    ]);

    liveGamesData = gamesResults;
    liveVotesData = votesResults;
    renderAllExperienceCards();
  } catch (err) {
    console.error(err);
    liveGamesData = [];
    liveVotesData = [];
    if (el.experiencesGrid) {
      el.experiencesGrid.innerHTML = '';
      const fallback = document.createElement('div');
      fallback.className = 'p-4 text-sm';
      fallback.textContent = 'Failed to load experiences.';
      el.experiencesGrid.appendChild(fallback);
    }
    if (el.experiencesCount) el.experiencesCount.textContent = '0';
  }
})();

// safe year
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
