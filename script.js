// Конфигурация
const CONFIG = {
    GAME_UNIVERSE_ID: '9678437015', // Universe ID игры
    GAME_PLACE_ID: '71240146627158', // Place ID для ссылок
    COMMUNITY_GROUP_ID: '102552180', // ID группы сообщества
    ROBLOX_USER_ID: '4828786884', // ID пользователя Kirill_Dev
    
    // API endpoints через RoProxy
    GAME_API_URL: 'https://games.roproxy.com/v1/games?universeIds=9678437015',
    GAME_ICON_URL: 'https://thumbnails.roproxy.com/v1/games/icons?universeIds=9678437015&size=512x512&format=Png',
    GAME_DETAILS_URL: 'https://games.roproxy.com/v1/games?universeIds=9678437015',
    GROUP_API_URL: 'https://groups.roproxy.com/v1/groups/102552180',
    GROUP_MEMBERS_URL: 'https://groups.roproxy.com/v1/groups/102552180',
    USER_API_URL: 'https://users.roproxy.com/v1/users/4828786884',
    
    CACHE_KEY: 'tower_obby_data',
    CACHE_DURATION: 300000, // 5 минут
    UPDATE_INTERVAL: 60000 // 1 минута для обновления данных
};

// Состояние приложения
const state = {
    currentLang: 'ru',
    currentTheme: 'dark',
    gameData: null,
    communityData: null,
    isLoading: false,
    lastUpdate: null
};

// DOM элементы
const elements = {
    themeToggle: document.getElementById('themeToggle'),
    langToggle: document.getElementById('langToggle'),
    themeIcon: document.querySelector('.theme-icon'),
    langText: document.querySelector('.lang-text'),
    gameThumbnail: document.getElementById('gameThumbnail'),
    gameTitle: document.getElementById('gameTitle'),
    gamePrice: document.getElementById('gamePrice'),
    gameRating: document.getElementById('gameRating'),
    gameActive: document.getElementById('gameActive'),
    gameVisits: document.getElementById('gameVisits'),
    communityMembers: document.getElementById('communityMembers'),
    communityGames: document.getElementById('communityGames'),
    gameCard: document.getElementById('gameCard'),
    communityCard: document.getElementById('communityCard'),
    ownerLink: document.getElementById('ownerLink'),
    viewCommunityBtn: document.getElementById('viewCommunityBtn'),
    viewCommunityPageBtn: document.getElementById('viewCommunityPageBtn')
};

// Инициализация
async function init() {
    console.log('Инициализация приложения...');
    
    // Загружаем сохраненные настройки
    loadSettings();
    
    // Устанавливаем тему
    setTheme(state.currentTheme);
    
    // Устанавливаем язык
    setLanguage(state.currentLang);
    
    // Добавляем обработчики событий
    setupEventListeners();
    
    // Загружаем данные
    await loadAllData();
    
    // Устанавливаем интервал обновления
    setInterval(loadAllData, CONFIG.UPDATE_INTERVAL);
    
    console.log('Инициализация завершена');
}

// Загрузка всех данных
async function loadAllData() {
    if (state.isLoading) return;
    
    state.isLoading = true;
    addLoadingClass();
    
    try {
        await Promise.all([
            loadGameData(),
            loadCommunityData()
        ]);
        
        state.lastUpdate = new Date();
        removeLoadingClass();
        showUpdateAnimation();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        loadCachedData();
        removeLoadingClass();
    }
}

// Загрузка данных игры
async function loadGameData() {
    try {
        console.log('Загрузка данных игры...');
        
        // Загружаем данные игры
        const gameResponse = await fetch(CONFIG.GAME_API_URL);
        const gameData = await gameResponse.json();
        
        if (gameData && gameData.data && gameData.data.length > 0) {
            const game = gameData.data[0];
            state.gameData = game;
            
            // Загружаем иконку игры
            const iconResponse = await fetch(CONFIG.GAME_ICON_URL);
            const iconData = await iconResponse.json();
            
            if (iconData && iconData.data && iconData.data.length > 0) {
                elements.gameThumbnail.src = iconData.data[0].imageUrl;
            }
            
            // Обновляем UI
            updateGameUI(game);
            
            // Сохраняем в кэш
            cacheData('gameData', game);
        }
    } catch (error) {
        console.error('Ошибка загрузки данных игры:', error);
        throw error;
    }
}

// Загрузка данных сообщества
async function loadCommunityData() {
    try {
        console.log('Загрузка данных сообщества...');
        
        // Загружаем данные группы
        const groupResponse = await fetch(CONFIG.GROUP_API_URL);
        const groupData = await groupResponse.json();
        
        if (groupData) {
            state.communityData = groupData;
            
            // Обновляем UI
            updateCommunityUI(groupData);
            
            // Сохраняем в кэш
            cacheData('communityData', groupData);
        }
    } catch (error) {
        console.error('Ошибка загрузки данных сообщества:', error);
        throw error;
    }
}

// Обновление UI игры
function updateGameUI(game) {
    if (!game) return;
    
    // Название игры
    elements.gameTitle.textContent = game.name || 'HD Admin Chaos Tower';
    
    // Цена (если есть)
    if (game.price) {
        elements.gamePrice.textContent = `💥 ${game.price} Robux`;
    }
    
    // Рейтинг
    if (game.voting) {
        const rating = Math.round(game.voting.score * 100) || 84;
        elements.gameRating.textContent = `${rating}%`;
    }
    
    // Активные игроки
    if (game.playing) {
        elements.gameActive.textContent = formatNumber(game.playing);
    }
    
    // Посещения
    if (game.visits) {
        elements.gameVisits.textContent = formatVisits(game.visits);
    }
    
    // Добавляем анимацию обновления
    elements.gameCard.classList.add('data-updated');
    setTimeout(() => {
        elements.gameCard.classList.remove('data-updated');
    }, 1000);
}

// Обновление UI сообщества
function updateCommunityUI(group) {
    if (!group) return;
    
    // Количество участников
    if (group.memberCount) {
        elements.communityMembers.textContent = formatNumber(group.memberCount);
    }
    
    // Количество игр (пока заглушка, можно добавить API для игр группы)
    elements.communityGames.textContent = '3';
    
    // Добавляем анимацию обновления
    elements.communityCard.classList.add('data-updated');
    setTimeout(() => {
        elements.communityCard.classList.remove('data-updated');
    }, 1000);
}

// Форматирование чисел
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Форматирование посещений
function formatVisits(visits) {
    if (!visits) return '0';
    if (visits >= 1000000) {
        return (visits / 1000000).toFixed(1) + 'M';
    }
    if (visits >= 1000) {
        return (visits / 1000).toFixed(1) + 'K';
    }
    return visits.toString();
}

// Кэширование данных
function cacheData(key, data) {
    const cacheItem = {
        data: data,
        timestamp: Date.now()
    };
    localStorage.setItem(`${CONFIG.CACHE_KEY}_${key}`, JSON.stringify(cacheItem));
}

// Загрузка кэшированных данных
function loadCachedData() {
    try {
        const gameCache = localStorage.getItem(`${CONFIG.CACHE_KEY}_gameData`);
        const communityCache = localStorage.getItem(`${CONFIG.CACHE_KEY}_communityData`);
        
        if (gameCache) {
            const { data, timestamp } = JSON.parse(gameCache);
            if (Date.now() - timestamp < CONFIG.CACHE_DURATION) {
                updateGameUI(data);
            }
        }
        
        if (communityCache) {
            const { data, timestamp } = JSON.parse(communityCache);
            if (Date.now() - timestamp < CONFIG.CACHE_DURATION) {
                updateCommunityUI(data);
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки кэша:', error);
    }
}

// Добавление класса загрузки
function addLoadingClass() {
    elements.gameCard.classList.add('loading');
    elements.communityCard.classList.add('loading');
}

// Удаление класса загрузки
function removeLoadingClass() {
    elements.gameCard.classList.remove('loading');
    elements.communityCard.classList.remove('loading');
}

// Анимация обновления
function showUpdateAnimation() {
    const footerText = document.querySelector('.footer-text span');
    if (footerText) {
        footerText.classList.add('data-updated');
        setTimeout(() => {
            footerText.classList.remove('data-updated');
        }, 1000);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Переключение темы
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Переключение языка
    elements.langToggle.addEventListener('click', toggleLanguage);
    
    // Клик по карточке сообщества
    elements.communityCard.addEventListener('click', (e) => {
        // Не переходим по ссылке, если клик был по кнопке или ссылке
        if (e.target.tagName === 'A' || e.target.closest('a')) {
            return;
        }
        window.open(`https://towerobbyproductions.github.io/communities/${CONFIG.COMMUNITY_GROUP_ID}/Tower-Obby-Productions/`, '_blank');
    });
}

// Переключение темы
function toggleTheme() {
    const newTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    state.currentTheme = newTheme;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

// Установка темы
function setTheme(theme) {
    const html = document.documentElement;
    const themeIcon = elements.themeIcon;
    
    if (theme === 'dark') {
        html.classList.remove('light');
        html.classList.add('dark');
        themeIcon.textContent = '🌙';
    } else {
        html.classList.remove('dark');
        html.classList.add('light');
        themeIcon.textContent = '☀️';
    }
}

// Переключение языка
function toggleLanguage() {
    const newLang = state.currentLang === 'ru' ? 'en' : 'ru';
    state.currentLang = newLang;
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
}

// Установка языка
function setLanguage(lang) {
    state.currentLang = lang;
    elements.langText.textContent = lang === 'ru' ? 'EN' : 'RU';
    
    // Обновляем все тексты
    document.querySelectorAll('[data-ru][data-en]').forEach(element => {
        element.textContent = element.getAttribute(`data-${lang}`);
    });
    
    // Обновляем placeholder'ы
    document.querySelectorAll('[data-ru-placeholder][data-en-placeholder]').forEach(element => {
        element.placeholder = element.getAttribute(`data-${lang}-placeholder`);
    });
}

// Загрузка настроек
function loadSettings() {
    const savedTheme = localStorage.getItem('theme');
    const savedLang = localStorage.getItem('language');
    
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        state.currentTheme = savedTheme;
    }
    
    if (savedLang && (savedLang === 'ru' || savedLang === 'en')) {
        state.currentLang = savedLang;
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);
