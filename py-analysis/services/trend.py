"""趋势预测服务：支持线性回归、多项式回归和指数加权回归"""
import logging
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline

from models.request import TrendResponse, DataPoint, PredictionPoint, ModelInfo
from db import get_timeseries

logger = logging.getLogger(__name__)

# 95% 置信水平对应的 z 值
Z_95 = 1.96


def _build_response(df, future_years, predictions, std_err, r_squared, model_name):
    """构建统一的 TrendResponse（消除三函数重复构造逻辑）"""
    history = [
        DataPoint(year=int(r["year"]), value=round(float(r["value"]), 4))
        for _, r in df.iterrows()
    ]
    prediction = [
        PredictionPoint(
            year=int(yr),
            value=round(float(pred), 4),
            lower=round(float(pred - Z_95 * std_err * (1 + 0.1 * i)), 4),
            upper=round(float(pred + Z_95 * std_err * (1 + 0.1 * i)), 4),
        )
        for i, (yr, pred) in enumerate(zip(future_years, predictions))
    ]
    return TrendResponse(
        history=history,
        prediction=prediction,
        model_info=ModelInfo(name=model_name, r_squared=round(r_squared, 4)),
    )


def _compute_future(df, years_ahead):
    """计算未来年份和对应 X 矩阵"""
    last_year = int(df["year"].max())
    future_years = np.array([last_year + i for i in range(1, years_ahead + 1)])
    return future_years, future_years.reshape(-1, 1)


def _predict_linear(df: pd.DataFrame, years_ahead: int) -> TrendResponse:
    """线性回归预测"""
    X = df["year"].values.reshape(-1, 1).astype(float)
    y = df["value"].values.astype(float)

    model = LinearRegression()
    model.fit(X, y)

    future_years, future_X = _compute_future(df, years_ahead)
    predictions = model.predict(future_X)

    # 残差标准差用于置信区间
    residuals = y - model.predict(X)
    std_err = np.std(residuals) if len(residuals) > 2 else 0
    r_squared = model.score(X, y)

    return _build_response(df, future_years, predictions, std_err, r_squared, "linear")


def _predict_polynomial(df: pd.DataFrame, years_ahead: int) -> TrendResponse:
    """二次多项式回归预测（捕捉增长放缓/拐点趋势）"""
    X = df["year"].values.reshape(-1, 1).astype(float)
    y = df["value"].values.astype(float)

    model = Pipeline([
        ("poly", PolynomialFeatures(degree=2, include_bias=False)),
        ("linear", LinearRegression()),
    ])
    model.fit(X, y)

    future_years, future_X = _compute_future(df, years_ahead)
    predictions = model.predict(future_X)

    residuals = y - model.predict(X)
    # 多项式自由度更高，需要更多残差点才估计 std_err
    std_err = np.std(residuals) if len(residuals) > 3 else 0
    r_squared = model.score(X, y)

    return _build_response(df, future_years, predictions, std_err, r_squared, "polynomial")


def _predict_ewm_linear(df: pd.DataFrame, years_ahead: int) -> TrendResponse:
    """指数加权线性回归（近期数据权重更高，适合教育数据的近期趋势变化）"""
    X = df["year"].values.reshape(-1, 1).astype(float)
    y = df["value"].values.astype(float)
    n = len(y)

    # 指数衰减权重：alpha 越大，近期数据权重越高
    alpha = 0.7
    weights = np.array([alpha ** (n - 1 - i) for i in range(n)])

    model = LinearRegression()
    model.fit(X, y, sample_weight=weights)

    future_years, future_X = _compute_future(df, years_ahead)
    predictions = model.predict(future_X)

    # 加权残差用于置信区间
    residuals = y - model.predict(X)
    weighted_resid = residuals * np.sqrt(weights)
    std_err = np.std(weighted_resid) if len(residuals) > 2 else 0

    # 加权 R²
    weighted_ss_res = np.sum(weights * residuals ** 2)
    weighted_mean = np.average(y, weights=weights)
    weighted_ss_tot = np.sum(weights * (y - weighted_mean) ** 2)
    r_squared = 1 - weighted_ss_res / weighted_ss_tot if weighted_ss_tot > 0 else 0

    return _build_response(df, future_years, predictions, std_err, r_squared, "ewm_linear")


def _try_models(df: pd.DataFrame, years_ahead: int) -> list[tuple[str, TrendResponse, float]]:
    """尝试所有模型，返回 (模型名, 响应, R²) 列表"""
    results = []
    for name, fn in [
        ("linear", _predict_linear),
        ("polynomial", _predict_polynomial),
        ("ewm_linear", _predict_ewm_linear),
    ]:
        try:
            resp = fn(df, years_ahead)
            r2 = resp.model_info.r_squared if resp.model_info.r_squared is not None else 0
            results.append((name, resp, r2))
        except Exception as e:
            logger.warning("模型 %s 拟合失败: %s", name, e)
    return results


def predict_trend(table: str, metric: str = None, province: str = None,
                  years_ahead: int = 5, model: str = "auto") -> TrendResponse:
    """
    趋势预测主入口

    模型选择逻辑:
    - model="auto": 依次拟合三种模型，选 R² 最高的
    - model="linear": 强制使用线性回归
    - model="polynomial": 强制使用二次多项式回归
    - model="ewm_linear": 强制使用指数加权回归
    """
    df = get_timeseries(table, metric=metric, province=province)

    if len(df) < 3:
        raise ValueError(f"数据点不足（{len(df)} 个），至少需要 3 个数据点才能预测")

    model_map = {
        "linear": _predict_linear,
        "polynomial": _predict_polynomial,
        "ewm_linear": _predict_ewm_linear,
    }

    if model in model_map:
        return model_map[model](df, years_ahead)

    # auto 模式：拟合所有候选模型，选 R² 最高的
    candidates = _try_models(df, years_ahead)
    if not candidates:
        # 全部失败时兜底用线性回归（此处不再 try，让异常自然抛出）
        return _predict_linear(df, years_ahead)

    best_name, best_resp, best_r2 = max(candidates, key=lambda x: x[2])
    logger.info("自动选择模型: %s (R²=%s)", best_name, best_r2)
    return best_resp
