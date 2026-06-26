const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');      // 用于签发和验证 JWT
const bcrypt = require('bcryptjs');       // 用于密码加密与校验
const { authMiddleware, JWT_SECRET } = require('./auth'); // 鉴权中间件
const { seedUsers } = require('./seed');  // 数据库初始化与预置账号

const app = express();
app.use(cors()); // 允许前端跨域请求

// 使用连接池管理 MySQL 连接，自动处理断线重连
const pool = mysql.createPool({
    host: 'localhost',      // 数据库地址
    user: 'root',           // 数据库用户名
    password: '1234',       // 数据库密码
    database: 'cn_edu_viz', // 数据库名称
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 允许查询的表名白名单（防止 SQL 注入）
const ALLOWED_TABLES = [
    '分省在校生数', '分省学位数', '分省招生数', '分省毕业生数',
    '在校生数', '分省学校数', '招生数', '教育经费', '毕业生数'
];

// 通用查询接口：根据表名查询数据（数据库为中文宽表格式）
app.get('/api/data/:table', (req, res) => {
    const { table } = req.params;
    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: '无效的表名' });
    }
    const sql = `SELECT * FROM \`${table}\``;
    pool.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '查询出错' });
        }
        res.json(results);
    });
});

// 获取所有可用表名（白名单）
app.get('/api/tables', (req, res) => {
    res.json(ALLOWED_TABLES);
});

// 获取数据库中所有真实表名
app.get('/api/db/tables', (req, res) => {
    const sql = `SELECT TABLE_NAME as name, TABLE_COMMENT as comment
                 FROM INFORMATION_SCHEMA.TABLES
                 WHERE TABLE_SCHEMA = 'cn_edu_viz'
                   AND TABLE_NAME NOT IN ('users', 'prediction_history')
                 ORDER BY TABLE_NAME`;
    pool.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '查询出错' });
        }
        res.json(results);
    });
});

// ============ 分析服务代理（使用原生 http 模块，避免中间件兼容性问题） ============

// 将 /api/analysis/* 请求代理到 FastAPI 分析服务（需鉴权）
app.use('/api/analysis', authMiddleware, (req, res) => {
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/analysis' + req.url,
        method: req.method,
        headers: {
            ...req.headers,
            host: 'localhost:8000',
        },
        timeout: 30000, // 30 秒超时，防止上游无响应时请求悬挂
    };

    // 手动收集请求体，避免 express.json() 消费 body 后 req.pipe 失效
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
        const body = Buffer.concat(chunks);

        const proxyReq = http.request(options, (proxyRes) => {
            // 原样转发 FastAPI 的状态码
            res.status(proxyRes.statusCode);
            // 原样转发响应头
            Object.entries(proxyRes.headers).forEach(([k, v]) => {
                res.setHeader(k, v);
            });
            // 原样转发响应体
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            console.error('代理请求失败:', err.message);
            res.status(502).json({ error: '分析服务不可用' });
        });

        // 有 body 时才发送（POST/PUT 请求）
        if (body.length > 0) {
            proxyReq.write(body);
        }
        proxyReq.end();
    });
});

// ============ 认证相关路由 ============

// 签发 JWT 的公共函数（登录和注册共用）
function signToken(userId, username) {
    return jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '24h' });
}

// 仅登录/注册需要解析 JSON body
app.post('/api/auth/login', express.json(), (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const sql = 'SELECT id, username, password FROM users WHERE username = ?';
    pool.query(sql, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '服务器错误' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const user = results[0];
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const token = signToken(user.id, user.username);
        res.json({ token, username: user.username });
    });
});

// 注册接口：创建新用户
app.post('/api/auth/register', express.json(), (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    if (username.length < 2 || username.length > 50) {
        return res.status(400).json({ error: '用户名长度应为 2-50 个字符' });
    }
    if (password.length < 4) {
        return res.status(400).json({ error: '密码长度不能少于 4 个字符' });
    }
    // 检查用户名是否已存在
    const checkSql = 'SELECT id FROM users WHERE username = ?';
    pool.query(checkSql, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '服务器错误' });
        }
        if (results.length > 0) {
            return res.status(409).json({ error: '该用户名已被注册' });
        }
        // 加密密码并插入
        const hash = bcrypt.hashSync(password, 10);
        const insertSql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        pool.query(insertSql, [username, hash, 'user'], (err2, result) => {
            if (err2) {
                console.error(err2);
                return res.status(500).json({ error: '注册失败' });
            }
            // 注册成功后直接签发 JWT
            const token = signToken(result.insertId, username);
            res.status(201).json({ token, username });
        });
    });
});

// 获取当前登录用户信息
app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ id: req.user.id, username: req.user.username });
});

// ============ 服务启动 ============

seedUsers(pool)
    .then(() => {
        app.listen(3000, () => {
            console.log('🚀 后端服务已启动: http://localhost:3000');
        });
    })
    .catch((err) => {
        console.error('❌ 启动失败：', err.message);
        process.exit(1);
    });
