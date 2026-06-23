-- 创建测试数据库
CREATE DATABASE cn_edu_viz DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 创建一个测试表
USE cn_edu_viz;

CREATE TABLE test_conn (
    id INT AUTO_INCREMENT PRIMARY KEY,
    msg VARCHAR(100) NOT NULL
);

