// index.js - работа с Telegram Web App API
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, запущены ли мы в Telegram Web App
    if (window.Telegram && Telegram.WebApp) {
        initTelegramApp();
    } else {
        // Режим разработки - используем тестовые данные
        initTestMode();
    }
    
    // Инициализация переключателя темы
    initThemeToggle();
});

// Инициализация Telegram Web App
function initTelegramApp() {
    console.log('🚀 Запущено в Telegram Web App');
    
    // Инициализируем Web App
    Telegram.WebApp.ready();
    Telegram.WebApp.expand(); // Раскрываем на весь экран
    
    // Получаем данные пользователя из Telegram
    const user = Telegram.WebApp.initDataUnsafe.user;
    
    if (user) {
        // Заполняем данные профиля
        document.getElementById('user-name').textContent = 
            `${user.first_name} ${user.last_name || ''}`.trim();
        document.getElementById('user-username').textContent = 
            user.username ? `@${user.username}` : 'Пользователь';
        
        // Устанавливаем аватар
        if (user.photo_url) {
            document.getElementById('user-avatar').src = user.photo_url;
        } else {
            // Создаем аватар с инициалами
            createAvatarFromName(user.first_name, user.last_name);
        }
        
        // Загружаем статистику (в реальном приложении - с сервера)
        loadUserStats(user.id);
    } else {
        setFallbackData();
    }
}

// Режим разработки (вне Telegram)
function initTestMode() {
    console.log('🔧 Режим разработки');
    
    // Тестовые данные пользователя
    const testUser = {
        id: 123456789,
        first_name: "Иван",
        last_name: "Петров",
        username: "ivan_petrov"
    };
    
    document.getElementById('user-name').textContent = 
        `${testUser.first_name} ${testUser.last_name}`;
    document.getElementById('user-username').textContent = `@${testUser.username}`;
    
    // Создаем аватар с инициалами
    createAvatarFromName(testUser.first_name, testUser.last_name);
    
    // Тестовая статистика
    setFallbackStats();
}

// Создание аватара с инициалами
function createAvatarFromName(firstName, lastName) {
    const initials = (firstName[0] + (lastName ? lastName[0] : '')).toUpperCase();
    const colors = ['#0088cc', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    const color = colors[initials.charCodeAt(0) % colors.length];
    
    const svg = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="${color}"/>
            <text x="50" y="50" font-family="Arial" font-size="40" fill="white" 
                  text-anchor="middle" dy=".3em">${initials}</text>
        </svg>
    `;
    
    document.getElementById('user-avatar').src = 
        'data:image/svg+xml;base64,' + btoa(svg);
}

// Загрузка статистики пользователя
async function loadUserStats(userId) {
    try {
        // В реальном приложении здесь был бы запрос к вашему API
        // const response = await fetch(`/api/stats/${userId}`);
        // const stats = await response.json();
        
        // Для демонстрации используем случайные данные
        const stats = {
            completed_tasks: Math.floor(Math.random() * 100) + 20,
            success_rate: Math.floor(Math.random() * 30) + 70,
            rating: (Math.random() * 2 + 3).toFixed(1)
        };
        
        document.getElementById('completed-tasks').textContent = stats.completed_tasks;
        document.getElementById('success-rate').textContent = `${stats.success_rate}%`;
        document.getElementById('rating').textContent = stats.rating;
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        setFallbackStats();
    }
}

// Запасные данные
function setFallbackData() {
    document.getElementById('user-name').textContent = 'Пользователь';
    document.getElementById('user-username').textContent = '@username';
    createAvatarFromName('П', '');
}

function setFallbackStats() {
    document.getElementById('completed-tasks').textContent = '0';
    document.getElementById('success-rate').textContent = '0';
    document.getElementById('rating').textContent = '0';
}

// Инициализация переключателя темы
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    
    // Проверяем сохраненную тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.checked = true;
    }
    
    // Синхронизируем с темой Telegram, если доступно
    if (window.Telegram && Telegram.WebApp) {
        const tgTheme = Telegram.WebApp.colorScheme;
        if (tgTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.checked = true;
            localStorage.setItem('theme', 'dark');
        }
    }
    
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });
}

// Функция для копирования ссылки-приглашения
function copyInviteLink() {
    let inviteLink = "https://t.me/LearningTrajectoryBot?start=invite";
    
    // В реальном приложении можно генерировать уникальную ссылку для каждого учителя
    if (window.Telegram && Telegram.WebApp) {
        const user = Telegram.WebApp.initDataUnsafe.user;
        if (user && user.id) {
            inviteLink = `https://t.me/LearningTrajectoryBot?start=invite_${user.id}`;
        }
    }
    
    // Копирование в буфер обмена
    navigator.clipboard.writeText(inviteLink).then(() => {
        showNotification('Ссылка скопирована в буфер обмена!');
    }).catch(err => {
        console.error('Ошибка копирования: ', err);
        // Fallback для старых браузеров
        fallbackCopyTextToClipboard(inviteLink);
    });
}

// Функция для показа уведомления
function showNotification(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    // Добавляем стили для анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 300);
    }, 3000);
}

// Fallback для копирования в старых браузерах
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.cssText = "position: fixed; left: -9999px; opacity: 0;";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Ссылка скопирована в буфер обмена!');
        } else {
            showNotification('Не удалось скопировать ссылку');
        }
    } catch (err) {
        console.error('Ошибка копирования: ', err);
        showNotification('Ошибка при копировании ссылки');
    }
    
    document.body.removeChild(textArea);
}