"""MySQL 数据读取工具：将宽表解析为 (year, value) 时序数据"""
import pymysql
import pandas as pd
from config import DB_CONFIG

# 允许查询的表名白名单（与 Node.js 后端保持一致）
ALLOWED_TABLES = [
    "分省在校生数", "分省学位数", "分省招生数", "分省毕业生数",
    "在校生数", "分省学校数", "招生数", "教育经费", "毕业生数",
]

# 全国维度的表（按"指标"列筛选行）
NATIONAL_TABLES = ["在校生数", "招生数", "毕业生数"]

# 分省维度的表（按"地区"列筛选行）
PROVINCIAL_TABLES = [
    "分省在校生数", "分省学位数", "分省招生数", "分省毕业生数",
    "分省学校数", "教育经费",
]


def _get_connection():
    """获取数据库连接"""
    return pymysql.connect(**DB_CONFIG)


def get_timeseries(table: str, metric: str = None, province: str = None) -> pd.DataFrame:
    """
    从指定表中提取时序数据，返回 DataFrame(columns=['year', 'value'])

    参数:
        table: MySQL 表名（必须在白名单中）
        metric: 全国表的指标名（如"普通本专科"）
        province: 分省表的省份名（如"北京市"）

    返回:
        DataFrame，列名为 year(int) 和 value(float)，已过滤无效数据
    """
    if table not in ALLOWED_TABLES:
        raise ValueError(f"不允许查询的表名: {table}")

    conn = _get_connection()
    try:
        # 查询整张表
        df = pd.read_sql(f"SELECT * FROM `{table}`", conn)
    finally:
        conn.close()

    if df.empty:
        return pd.DataFrame(columns=["year", "value"])

    # 识别年份列：列名匹配 "YYYY年" 格式，且数据类型为数值型
    year_cols = []
    for col in df.columns:
        if col.endswith("年") and col[:-1].isdigit():
            # 过滤 varchar 类型的年份列（数据不完整，如分省表的"2025年"）
            if df[col].dtype in ["float64", "int64", "float32", "int32"]:
                year_cols.append(col)

    if not year_cols:
        return pd.DataFrame(columns=["year", "value"])

    # 根据表类型筛选行
    if table in NATIONAL_TABLES and "指标" in df.columns:
        if not metric:
            raise ValueError(f"表 {table} 需要提供 metric 参数")
        row = df[df["指标"] == metric]
        if row.empty:
            return pd.DataFrame(columns=["year", "value"])
        values = row[year_cols].iloc[0]
    elif table in PROVINCIAL_TABLES and "地区" in df.columns:
        if province:
            row = df[df["地区"] == province]
        else:
            # 未指定省份时取全国汇总行
            row = df[df["地区"] == "全国"]
        if row.empty:
            return pd.DataFrame(columns=["year", "value"])
        values = row[year_cols].iloc[0]
    else:
        return pd.DataFrame(columns=["year", "value"])

    # 构建时序 DataFrame
    result = pd.DataFrame({
        "year": [int(col.replace("年", "")) for col in year_cols],
        "value": values.values.astype(float),
    })
    # 过滤掉 NaN 和 0 值（0 值通常是未统计而非真实数据，会严重干扰预测）
    result = result.dropna(subset=["value"])
    result = result[result["value"] > 0]
    result = result.reset_index(drop=True)
    return result


def get_available_metrics(table: str) -> list[str]:
    """获取全国表中所有可用的指标名列表"""
    if table not in NATIONAL_TABLES:
        return []
    conn = _get_connection()
    try:
        df = pd.read_sql(f"SELECT * FROM `{table}`", conn)
    finally:
        conn.close()
    if "指标" not in df.columns:
        return []
    return df["指标"].dropna().unique().tolist()


def get_available_provinces(table: str) -> list[str]:
    """获取分省表中所有可用的省份名列表"""
    if table not in PROVINCIAL_TABLES:
        return []
    conn = _get_connection()
    try:
        df = pd.read_sql(f"SELECT * FROM `{table}`", conn)
    finally:
        conn.close()
    if "地区" not in df.columns:
        return []
    return df["地区"].dropna().unique().tolist()
