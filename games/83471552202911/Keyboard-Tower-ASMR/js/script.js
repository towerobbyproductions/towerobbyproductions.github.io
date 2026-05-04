// Конфигурация
const CONFIG = {
    UNIVERSE_ID: '10108284887',
    API_URL: 'https://games.roproxy.com/v1/games?universeIds=10108284887',
    CACHE_KEY: 'keyboard_tower_asmr_game_data',
    CACHE_DURATION: 300000, // 5 минут
    AUTO_SLIDE_INTERVAL: 5000 // 5 секунд
};

// Состояние приложения
let currentLang = 'en';
let currentSlide = 0;
let autoSlideInterval;

// Базовые fallback-данные
const DEFAULT_GAME_DATA = {
    name: '🎧 Keyboard Tower ASMR',
    description: 'Welcome to Keyboard Tower ASMR — a satisfying Tower Obby experience. Climb the tower, enjoy the ASMR vibe, and challenge yourself to reach the top!',
    playing: 0,
    favoritedCount: 130,
    visits: 2130,
    maxPlayers: 36,
    created: '2026-05-01',
    updated: '2026-05-04',
    genre: 'Obby & Platformer',
    subgenre: 'Tower Obby',
    maturity: 'Mild',
    rootPlaceId: '83471552202911',
    images: [
        'https://tr.rbxcdn.com/180DAY-ac99810b043fcc8b90d47a062764b279/768/432/Image/Webp/noFilter?auto=compress&cs=tinysrgb&w=1200',
        'https://tr.rbxcdn.com/180DAY-0319103f58ead123c482d498a9ad2494/768/432/Image/Webp/noFilter?auto=compress&cs=tinysrgb&w=1200',
        'https://tr.rbxcdn.com/180DAY-0ea63b43b51f872ed2a3f00272ab3285/768/432/Image/Webp/noFilter'
    ]
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLanguage();
    setupEventListeners();
    initAutoSlide();
    document.getElementById("year").textContent = new Date().getFullYear();

    // Сначала показываем fallback, потом обновляем живыми данными
    updateUI(DEFAULT_GAME_DATA);
    fetchGameData();
});

// ========== ТЕМА ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const themeBtn = document.getElementById('themeToggle');

    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        if (themeBtn) themeBtn.textContent = '☀️';
    } else {
        document.documentElement.classList.add('dark');
        if (themeBtn) themeBtn.textContent = '🌙';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const themeButton = document.getElementById('themeToggle');

    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        if (themeButton) themeButton.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        if (themeButton) themeButton.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    }
}

// ========== ЯЗЫК ==========
function initLanguage() {
    const savedLang = localStorage.getItem('language') || 'en';
    currentLang = savedLang;
    updateLanguage();
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ru' : 'en';
    localStorage.setItem('language', currentLang);
    updateLanguage();
}

function updateLanguage() {
    const langButton = document.getElementById('langToggle');
    if (langButton) langButton.textContent = currentLang === 'en' ? 'RU' : 'EN';

    document.querySelectorAll('[data-lang-en]').forEach(el => {
        const text = el.getAttribute(`data-lang-${currentLang}`);
        if (text) el.textContent = text;
    });
}

// ========== СЛАЙДЕР ==========
function changeSlide(direction) {
    const wrapper = document.getElementById('sliderWrapper');
    if (!wrapper) return;

    const totalSlides = wrapper.children.length;
    if (totalSlides === 0) return;

    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function initAutoSlide() {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => changeSlide(1), CONFIG.AUTO_SLIDE_INTERVAL);
}

function setupSliderHover() {
    const slider = document.querySelector('.slider-container');
    if (slider) {
        slider.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
        slider.addEventListener('mouseleave', () => initAutoSlide());
    }
}

// ========== FETCH ==========
async function fetchGameData() {
    try {
        showLoadingState();

        const cached = getCache();
        if (cached) {
            updateUI(cached);
            hideLoadingState();
            return;
        }

        const response = await fetch(CONFIG.API_URL);
        if (!response.ok) throw new Error('Failed to fetch game data');

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const gameData = data.data[0];
            setCache(gameData);
            updateUI(gameData);
        }

        hideLoadingState();
    } catch (error) {
        console.error('Error fetching game data:', error);
        handleFetchError(error);
        hideLoadingState();
    }
}

function showLoadingState() {
    document.querySelectorAll('.stat-card').forEach(el => el.classList.add('loading'));
}

function hideLoadingState() {
    document.querySelectorAll('.stat-card').forEach(el => el.classList.remove('loading'));
}

function handleFetchError(error) {
    const titleEl = document.getElementById('gameTitle');
    const descEl = document.getElementById('gameDescription');

    if (titleEl) titleEl.textContent = DEFAULT_GAME_DATA.name;
    if (descEl) {
        descEl.textContent = currentLang === 'en'
            ? DEFAULT_GAME_DATA.description
            : 'Добро пожаловать в Keyboard Tower ASMR — приятный Tower Obby опыт.';
    }
}

// ========== КЭШ ==========
function getCache() {
    try {
        const cached = localStorage.getItem(CONFIG.CACHE_KEY);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CONFIG.CACHE_DURATION) return data;

        localStorage.removeItem(CONFIG.CACHE_KEY);
        return null;
    } catch (error) {
        console.error('Cache read error:', error);
        return null;
    }
}

function setCache(data) {
    try {
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (error) {
        console.error('Cache write error:', error);
    }
}

// ========== UPDATE UI ==========
function updateUI(gameData) {
    const data = { ...DEFAULT_GAME_DATA, ...gameData };

    // Title & description
    const title = document.getElementById('gameTitle');
    if (title) title.textContent = data.name || 'Roblox Game';
    document.title = `${data.name || 'Roblox Game'} - Tower Obby Productions`;

    const desc = document.getElementById('gameDescription');
    if (desc) desc.textContent = data.description || 'No description available.';

    // Stats
    const active = document.getElementById('activePlayers');
    if (active) active.textContent = formatNumber(data.playing || 0);

    const fav = document.getElementById('favorites');
    if (fav) fav.textContent = formatNumber(data.favoritedCount || data.favorites || 0);

    const visits = document.getElementById('visits');
    if (visits) visits.textContent = formatNumber(data.visits || 0);

    const serverSize = document.getElementById('serverSize');
    if (serverSize) serverSize.textContent = data.maxPlayers || data.serverSize || '36';

    // Dates
    const created = document.getElementById('created');
    if (created) created.textContent = formatDate(data.created || data.createdAt || data.createdTime);

    const updated = document.getElementById('updated');
    if (updated) updated.textContent = formatDate(data.updated || data.updatedAt || data.updatedTime);

    // Genre & Subgenre
    let genreVal = (data.genre || data.genreName || '').toString();
    if (!genreVal || genreVal.trim().toLowerCase() === 'all') genreVal = 'Obby & Platformer';
    const genreEl = document.getElementById('genre');
    if (genreEl) genreEl.textContent = genreVal;

    let subgenreVal = (data.subGenre || data.subgenre || data.subGenreName || '').toString();
    if (!subgenreVal || subgenreVal.trim().toLowerCase() === 'all') subgenreVal = 'Tower Obby';
    const subgenreEl = document.getElementById('subgenre');
    if (subgenreEl) subgenreEl.textContent = subgenreVal;

    // Play link
    const playLink = document.getElementById('playLink');
    if (playLink) {
        playLink.href = data.rootPlaceId
            ? `https://www.roblox.com/games/${data.rootPlaceId}/Keyboard-Tower-ASMR`
            : 'https://www.roblox.com/games/83471552202911/Keyboard-Tower-ASMR';
    }

    // Owner
    const ownerLink = document.getElementById('ownerLink');
    if (ownerLink) {
        ownerLink.textContent = 'Tower Obby Productions';
        ownerLink.href = 'https://towerobbyproductions.github.io/communities/102552180/Tower-Obby-Productions/';
    }

    // Maturity
    const maturityText = detectMaturity(data);
    const matEl = document.getElementById('maturity');
    if (matEl) matEl.innerHTML = `<span class="maturity-badge">${maturityText}</span>`;

    // Images
    let images = [];
    if (Array.isArray(data.images) && data.images.length) {
        images = data.images.map(i => i && (i.url || i.imageUrl || i)).filter(Boolean);
    } else if (Array.isArray(data.thumbnailUrls) && data.thumbnailUrls.length) {
        images = data.thumbnailUrls.slice();
    } else if (data.coverImageUrl) {
        images = [data.coverImageUrl];
    } else if (data.thumbnailUrl) {
        images = [data.thumbnailUrl];
    }

    images = [...new Set([...images, ...DEFAULT_GAME_DATA.images])].slice(0, 6);
    renderSliderImages(images);

    // Meta tags
    updateMetaTags(data, images[0]);
}

function detectMaturity(gameData) {
    const candidates = [
        gameData.maturity,
        gameData.maturityRating,
        gameData.maturityRatingName,
        (gameData.ageClassification && gameData.ageClassification.classification),
        gameData.minimumAgeRequirement,
        gameData.ageRating,
        (gameData.isAdult ? 'Adult' : null)
    ];

    for (const c of candidates) {
        if (c !== undefined && c !== null && String(c).trim() !== '') return String(c);
    }
    return 'Mild';
}

function renderSliderImages(images) {
    const wrapper = document.getElementById('sliderWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = images.map((src, idx) => {
        return `<img src="${src}" loading="lazy" alt="Screenshot ${idx + 1}" class="slider-image" />`;
    }).join('');

    currentSlide = 0;
    wrapper.style.transform = 'translateX(0%)';
}

function updateMetaTags(gameData, image) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', `${gameData.name || 'Roblox Game'} - Tower Obby Productions`);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', (gameData.description || 'Play this Roblox game online').substring(0, 160));

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && image) ogImage.setAttribute('content', image);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', `${gameData.name || 'Roblox Game'} - Tower Obby Productions`);

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute('content', (gameData.description || 'Play this Roblox game online').substring(0, 160));

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage && image) twitterImage.setAttribute('content', image);
}

// ========== УТИЛИТЫ ==========
function formatNumber(num) {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'N/A';
    }
}

// ========== EVENTS ==========
function setupEventListeners() {
    const themeToggle = document.getElementById('themeToggle');
    const langToggle = document.getElementById('langToggle');

    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (langToggle) langToggle.addEventListener('click', toggleLanguage);

    setupSliderHover();
}

// Глобальный доступ для onclick
window.changeSlide = changeSlide;
