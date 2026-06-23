const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors()); // 允许前端跨域请求
app.use(bodyParser.json());

// 1. 配置 MySQL 数据库连接
const db = mysql.createConnection({
    host: 'localhost',      // 数据库地址
    user: 'root',           // 数据库用户名
    password: '1234',    // 数据库密码
    database: 'cn_edu_viz'     // 你要连接的数据库名称
});

// 连接数据库
db.connect((err) => {
    if (err) {
        console.error('数据库连接失败:', err);
    } else {
        console.log('MySQL 数据库连接成功！');
    }
});

app.get('/api/test', (req, res) => {
    const sql = 'SELECT * FROM test_conn';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('查询出错');
        } else {
            res.json(results);
        }
    });
});

// 3. 启动后端服务器，监听 3000 端口
app.listen(3000, () => {
    console.log('🚀 后端服务已启动: http://localhost:3000');
});