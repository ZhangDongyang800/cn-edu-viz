// JWT 鉴权中间件
const jwt = require('jsonwebtoken');

// JWT 密钥（与签发时保持一致）
const JWT_SECRET = 'edu-viz-secret-2026';

/**
 * 鉴权中间件：从 Authorization 头提取 Bearer token 并验证
 * 验证成功将用户信息挂到 req.user，失败返回 401
 */
function authMiddleware(req, res, next) {
    // 从请求头获取 Authorization 字段
    const authHeader = req.headers['authorization'];
    // 期望格式：Bearer <token>
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7) // 去掉 "Bearer " 前缀，取出实际 token
        : null;

    // 未携带 token，直接返回 401
    if (!token) {
        return res.status(401).json({ error: '未登录或登录已过期' });
    }

    try {
        // 验证 token 并解码 payload
        const decoded = jwt.verify(token, JWT_SECRET);
        // 将用户信息挂到请求对象上，供后续路由使用
        req.user = { id: decoded.id, username: decoded.username };
        next();
    } catch (err) {
        // token 无效或已过期
        return res.status(401).json({ error: '未登录或登录已过期' });
    }
}

module.exports = { authMiddleware, JWT_SECRET };
