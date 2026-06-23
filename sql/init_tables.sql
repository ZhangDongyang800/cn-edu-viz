-- ============================================================
-- MySQL 建表脚本
-- 数据库：cn_edu_viz
-- 说明：表结构必须与 Spark DataAnalysis 输出的 DataFrame 列完全一致
--       Spark 使用 SaveMode.Overwrite，会 DROP 旧表按 DataFrame schema 重建
--       所以不要加 id 等 Spark 不输出的列
-- ============================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS cn_edu_viz DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE cn_edu_viz;

-- -----------------------------------------------------------
-- 全国在校生数年度趋势
-- Spark: dfStudents.filter(indicators).select("indicator","year","value")
-- -----------------------------------------------------------
DROP TABLE IF EXISTS students_trend;
CREATE TABLE students_trend (
    indicator VARCHAR(100) COMMENT '指标名称',
    year INT COMMENT '年份',
    value DOUBLE COMMENT '数值（万人）'
) COMMENT '全国各类学历教育在校生数年度趋势';

-- -----------------------------------------------------------
-- 全国招生数年度趋势
-- Spark: dfEnrollment.filter(indicators).select("indicator","year","value")
-- -----------------------------------------------------------
DROP TABLE IF EXISTS enrollment_trend;
CREATE TABLE enrollment_trend (
    indicator VARCHAR(100) COMMENT '指标名称',
    year INT COMMENT '年份',
    value DOUBLE COMMENT '数值（万人）'
) COMMENT '全国各类学历教育招生数年度趋势';

-- -----------------------------------------------------------
-- 全国毕业生数年度趋势
-- Spark: dfGraduates.filter(indicators).select("indicator","year","value")
-- -----------------------------------------------------------
DROP TABLE IF EXISTS graduates_trend;
CREATE TABLE graduates_trend (
    indicator VARCHAR(100) COMMENT '指标名称',
    year INT COMMENT '年份',
    value DOUBLE COMMENT '数值（万人）'
) COMMENT '全国各类学历教育毕业生数年度趋势';

-- -----------------------------------------------------------
-- 研究生与本专科增长对比
-- Spark: gradStudents.join(undergradStudents).select("year","graduate_students","undergrad_students")
-- -----------------------------------------------------------
DROP TABLE IF EXISTS grad_vs_undergrad;
CREATE TABLE grad_vs_undergrad (
    year INT COMMENT '年份',
    graduate_students DOUBLE COMMENT '研究生在校生数（万人）',
    undergrad_students DOUBLE COMMENT '本专科在校生数（万人）'
) COMMENT '研究生与本专科在校生增长对比';

-- -----------------------------------------------------------
-- 分省教育经费
-- Spark: readProvincial → select("province","year","value")
-- -----------------------------------------------------------
DROP TABLE IF EXISTS provincial_funding;
CREATE TABLE provincial_funding (
    province VARCHAR(50) COMMENT '省份',
    year INT COMMENT '年份',
    value DOUBLE COMMENT '教育经费（万元）'
) COMMENT '分省年度教育经费';

-- -----------------------------------------------------------
-- 分省本专科在校生数
-- -----------------------------------------------------------
DROP TABLE IF EXISTS provincial_students;
CREATE TABLE provincial_students (
    province VARCHAR(50) COMMENT '省份',
    year INT COMMENT '年份',
    value DOUBLE COMMENT '在校生数（万人）'
) COMMENT '分省本专科在校生数';

-- -----------------------------------------------------------
-- 分省本专科招生数
-- -----------------------------------------------------------
DROP TABLE IF EXISTS provincial_enrollment;
CREATE TABLE provincial_enrollment (
    province VARCHAR(50) COMMENT '省份',
    year INT COMMENT '年份',
    value DOUBLE COMMENT '招生数（万人）'
) COMMENT '分省本专科招生数';

-- -----------------------------------------------------------
-- 分省本专科毕业生数
-- -----------------------------------------------------------
DROP TABLE IF EXISTS provincial_graduates;
CREATE TABLE provincial_graduates (
    province VARCHAR(50) COMMENT '省份',
    year INT COMMENT '年份',
    value DOUBLE COMMENT '毕业生数（万人）'
) COMMENT '分省本专科毕业生数';

-- -----------------------------------------------------------
-- 分省学位授予数
-- -----------------------------------------------------------
DROP TABLE IF EXISTS provincial_degrees;
CREATE TABLE provincial_degrees (
    province VARCHAR(50) COMMENT '省份',
    year INT COMMENT '年份',
    value DOUBLE COMMENT '学位授予数（万人）'
) COMMENT '分省本专科学位授予数';

-- -----------------------------------------------------------
-- 分省高等学校数
-- -----------------------------------------------------------
DROP TABLE IF EXISTS provincial_schools;
CREATE TABLE provincial_schools (
    province VARCHAR(50) COMMENT '省份',
    year INT COMMENT '年份',
    value DOUBLE COMMENT '学校数（所）'
) COMMENT '分省普通职业高等学校数';

-- -----------------------------------------------------------
-- 高中阶段教育结构分析
-- Spark: seniorHigh.join(vocational).select("year","senior_high","vocational")
-- -----------------------------------------------------------
DROP TABLE IF EXISTS high_school_structure;
CREATE TABLE high_school_structure (
    year INT COMMENT '年份',
    senior_high DOUBLE COMMENT '普通高中在校生数（万人）',
    vocational DOUBLE COMMENT '中等职业教育在校生数（万人）'
) COMMENT '高中阶段教育结构分析';

-- -----------------------------------------------------------
-- 义务教育趋势分析
-- Spark: juniorHigh.join(primarySchool).select("year","junior_high","primary_school")
-- -----------------------------------------------------------
DROP TABLE IF EXISTS compulsory_education_trend;
CREATE TABLE compulsory_education_trend (
    year INT COMMENT '年份',
    junior_high DOUBLE COMMENT '初中在校生数（万人）',
    primary_school DOUBLE COMMENT '小学在校生数（万人）'
) COMMENT '义务教育在校生趋势';
