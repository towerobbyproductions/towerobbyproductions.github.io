
// Конфигурация
const CONFIG = {
    // ЗАМЕНИТЕ НА ВАШ URL ОТ GOOGLE APPS SCRIPT
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    REFRESH_INTERVAL: 30000, // 30 секунд
    LEADERBOARD_SIZE: 25 // Показываем топ 25
};

// Состояние приложения
let currentLang = 'en';
let currentCategory = 'slaps';
let refreshTimers = {};

// Данные
let leaderboardData = {
    slaps: [],
    time: [],
    robux: []
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLanguage();
    initTabs();
    fetchAllLeaderboards();
    setupEventListeners();
    updateYear();
});

// ========== ТЕМА ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) themeBtn.textContent = '☀️';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const themeButton = document.getElementById('themeToggle');

    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        themeButton.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        themeButton.textContent = '🌙';
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

// ========== ТАБЫ ==========
function initTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.leaderboard').forEach(l => l.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            currentCategory = tab.getAttribute('data-category');
            
            // Show corresponding leaderboard
            document.getElementById(`${currentCategory}-leaderboard`).classList.add('active');
            
            // Refresh data if empty
            if (leaderboardData[currentCategory].length === 0) {
                fetchLeaderboard(currentCategory);
            }
        });
    });
}

// ========== FETCH LEADERBOARDS ==========
async function fetchAllLeaderboards() {
    showAllLoadingStates();
    
    try {
        await Promise.all([
            fetchLeaderboard('slaps'),
            fetchLeaderboard('time'),
            fetchLeaderboard('robux')
        ]);
    } catch (error) {
        console.error('Error fetching leaderboards:', error);
    }
    
    startRefreshTimers();
}

async function fetchLeaderboard(type) {
    const tbody = document.getElementById(`${type}-body`);
    if (!tbody) return;
    
    try {
        // Show loading state
        showLoadingState(type);
        
        // Fetch from Google Apps Script
        const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?type=${type}&limit=${CONFIG.LEADERBOARD_SIZE}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
            leaderboardData[type] = data.data;
            renderLeaderboard(type, data.data);
        } else {
            throw new Error(data.error || 'Invalid data format');
        }
        
    } catch (error) {
        console.error(`Error fetching ${type} leaderboard:`, error);
        showErrorState(type, error.message);
    }
}

function renderLeaderboard(type, data) {
    const tbody = document.getElementById(`${type}-body`);
    if (!tbody) return;
    
    if (!data || data.length === 0) {
        showEmptyState(type);
        return;
    }
    
    tbody.innerHTML = data.map((entry, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        
        let valueClass = '';
        let formattedValue = entry.value;
        
        if (type === 'slaps') {
            valueClass = 'value-slaps';
            formattedValue = formatNumber(entry.value);
        } else if (type === 'time') {
            valueClass = 'value-time';
            formattedValue = formatTime(entry.value);
        } else if (type === 'robux') {
            valueClass = 'value-robux';
            formattedValue = formatNumber(entry.value);
        }
        
        return `
            <tr style="animation-delay: ${index * 0.05}s">
                <td class="font-bold">${medal}</td>
                <td>
                    <div class="player-cell">
                        <img src="https://www.roblox.com/headshot-thumbnail/image?userId=${entry.userId}&width=100&height=100&format=png" 
                             alt="${entry.username}" 
                             class="player-avatar"
                             loading="lazy"
                             onerror="this.src='https://www.roblox.com/asset/?id=7077934044'">
                        <div class="player-name">
                            <a href="https://www.roblox.com/users/${entry.userId}/profile" target="_blank" rel="noopener">
                                @${entry.username}
                            </a>
                        </div>
                    </div>
                </td>
                <td class="${valueClass}">${formattedValue}</td>
            </tr>
        `;
    }).join('');
    
    // Highlight the row if it's the current category
    if (type === currentCategory) {
        tbody.parentElement?.classList.add('data-updated');
        setTimeout(() => {
            tbody.parentElement?.classList.remove('data-updated');
        }, 1000);
    }
}

// ========== UI STATES ==========
function showLoadingState(type) {
    const tbody = document.getElementById(`${type}-body`);
    if (!tbody) return;
    
    const rows = Array(CONFIG.LEADERBOARD_SIZE).fill(0).map(() => `
        <tr class="loading-row">
            <td>•••</td>
            <td><div class="player-cell"><div class="player-avatar"></div>••••••••</div></td>
            <td>••••••</td>
        </tr>
    `).join('');
    
    tbody.innerHTML = rows;
}

function showAllLoadingStates() {
    ['slaps', 'time', 'robux'].forEach(type => showLoadingState(type));
}

function showErrorState(type, message) {
    const tbody = document.getElementById(`${type}-body`);
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="3" class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${currentLang === 'en' ? 'Failed to load data' : 'Ошибка загрузки'}</p>
                <p class="text-sm opacity-75">${message}</p>
                <button class="retry-btn" onclick="fetchLeaderboard('${type}')">
                    ${currentLang === 'en' ? 'Try Again' : 'Повторить'}
                </button>
            </td>
        </tr>
    `;
}

function showEmptyState(type) {
    const tbody = document.getElementById(`${type}-body`);
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="3" class="empty-message">
                <i class="fas fa-users mb-2" style="font-size: 2rem;"></i>
                <p>${currentLang === 'en' ? 'No data available' : 'Нет данных'}</p>
            </td>
        </tr>
    `;
}

// ========== REFRESH TIMERS ==========
function startRefreshTimers() {
    ['slaps', 'time', 'robux'].forEach(type => {
        if (refreshTimers[type]) clearInterval(refreshTimers[type]);
        
        let timeLeft = CONFIG.REFRESH_INTERVAL / 1000;
        const timerEl = document.getElementById(`${type}-timer`);
        
        refreshTimers[type] = setInterval(() => {
            timeLeft--;
            
            if (timerEl) {
                timerEl.textContent = currentLang === 'en' 
                    ? `Update in ${timeLeft}s` 
                    : `Обновление через ${timeLeft}с`;
            }
            
            if (timeLeft <= 0) {
                fetchLeaderboard(type);
                timeLeft = CONFIG.REFRESH_INTERVAL / 1000;
            }
        }, 1000);
    });
}

// ========== FORMATTING ==========
function formatNumber(num) {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatTime(seconds) {
    seconds = Math.floor(seconds || 0);
    
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    
    const parts = [];
    if (days > 0) parts.push(days + 'd');
    if (hours > 0) parts.push(hours + 'h');
    if (minutes > 0) parts.push(minutes + 'm');
    if (seconds > 0 || parts.length === 0) parts.push(seconds + 's');
    
    return parts.join(' ');
}

function updateYear() {
    document.getElementById('year').textContent = new Date().getFullYear();
}

// ========== EVENTS ==========
function setupEventListeners() {
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('langToggle')?.addEventListener('click', toggleLanguage);
}

// Make fetchLeaderboard available globally for retry buttons
window.fetchLeaderboard = fetchLeaderboard;
