const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

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

// 通用查询接口：根据表名查询数据
app.get('/api/data/:table', (req, res) => {
    const { table } = req.params;
    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: '无效的表名' });
    }
    const sql = `SELECT * FROM \`${table}\``;
    pool.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: '查询出错' });
        } else {
            res.json(results);
        }
    });
});

// 获取所有可用表名
app.get('/api/tables', (req, res) => {
    res.json(ALLOWED_TABLES);
});

// 启动后端服务器，监听 3000 端口
app.listen(3000, () => {
    console.log('🚀 后端服务已启动: http://localhost:3000');
});