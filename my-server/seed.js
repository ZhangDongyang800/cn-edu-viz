// 数据库初始化：建表 + 预置账号
const bcrypt = require('bcryptjs');

/**
 * 初始化数据库：
 * 1. 创建 users 表（用户账号）
 * 2. 预置两个账号 admin/123456、user/123456
 * 使用 ON DUPLICATE KEY UPDATE 避免重复插入
 */
async function seedUsers(pool) {
    // 创建 users 表
    const createUserTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
            username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名（唯一）',
            password VARCHAR(255) NOT NULL COMMENT 'bcrypt 加密后的密码',
            role VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT '角色：admin/user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
    `;

    // 预置账号：仅首次插入，已存在的不覆盖（避免每次重启重置密码）
    const saltRounds = 10;
    const adminPassword = bcrypt.hashSync('123456', saltRounds);
    const userPassword = bcrypt.hashSync('123456', saltRounds);

    const upsertUser = `
        INSERT INTO users (username, password, role)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE id = id;
    `;

    try {
        await pool.promise().query(createUserTable);
        console.log('✅ users 表已就绪');

        await pool.promise().query(upsertUser, ['admin', adminPassword, 'admin']);
        await pool.promise().query(upsertUser, ['user', userPassword, 'user']);
        console.log('✅ 预置账号已就绪：admin/123456, user/123456');
    } catch (err) {
        console.error('❌ 数据库初始化失败:', err.message);
        throw err;
    }
}

module.exports = { seedUsers };
