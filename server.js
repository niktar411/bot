// server.js - сервер с подключением к базе данных
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// Конфигурация подключения к базе данных
const dbConfig = {
    user: process.env.DB_USER || 'postgres',           // Имя пользователя БД
    host: process.env.DB_HOST || 'localhost',              // Хост БД
    database: process.env.DB_NAME || 'new_learn',      // Имя базы данных
    password: process.env.DB_PASSWORD || '11122233',  // Пароль БД
    port: process.env.DB_PORT || 5432,                    // Порт БД (по умолчанию 5432 для PostgreSQL)
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false // SSL опционально
};

// Создание пула подключений
const pool = new Pool(dbConfig);

// Проверка подключения к базе данных
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Ошибка подключения к базе данных:', err.stack);
    } else {
        console.log('✅ Успешное подключение к базе данных');
        release();
    }
});

// Middleware
app.use(express.static('.')); // Раздаем файлы из текущей директории
app.use(express.json());      // Для парсинга JSON

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API для получения статистики пользователя
app.get('/api/stats/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
        const query = `
            SELECT completed_tasks, success_rate, rating 
            FROM user_stats 
            WHERE user_id = $1
        `;
        
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            // Если пользователь не найден, возвращаем данные по умолчанию
            res.json({
                completed_tasks: 0,
                success_rate: 0,
                rating: 0
            });
        }
    } catch (error) {
        console.error('Ошибка при запросе к БД:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// API для сохранения статистики пользователя
app.post('/api/stats/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { completed_tasks, success_rate, rating } = req.body;
    
    try {
        const query = `
            INSERT INTO user_stats (user_id, completed_tasks, success_rate, rating) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                completed_tasks = EXCLUDED.completed_tasks,
                success_rate = EXCLUDED.success_rate,
                rating = EXCLUDED.rating,
                updated_at = CURRENT_TIMESTAMP
        `;
        
        await pool.query(query, [userId, completed_tasks, success_rate, rating]);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при сохранении в БД:', error);
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

// API для получения темы пользователя
app.get('/api/theme/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
        const query = `SELECT theme FROM user_preferences WHERE user_id = $1`;
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length > 0) {
            res.json({ theme: result.rows[0].theme });
        } else {
            res.json({ theme: 'light' });
        }
    } catch (error) {
        console.error('Ошибка при запросе темы:', error);
        res.json({ theme: 'light' });
    }
});

// API для сохранения темы пользователя
app.post('/api/theme/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { theme } = req.body;
    
    try {
        const query = `
            INSERT INTO user_preferences (user_id, theme) 
            VALUES ($1, $2)
            ON CONFLICT (user_id) 
            DO UPDATE SET theme = EXCLUDED.theme
        `;
        
        await pool.query(query, [userId, theme]);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при сохранении темы:', error);
        res.status(500).json({ error: 'Ошибка сохранения темы' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    console.log(`📊 База данных: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Завершение работы сервера...');
    await pool.end();
    process.exit(0);
});