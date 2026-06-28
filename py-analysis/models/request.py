"""Pydantic 请求/响应模型"""
from typing import Optional
from pydantic import BaseModel, Field


class TrendRequest(BaseModel):
    """趋势预测请求"""
    table: str = Field(..., description="MySQL 表名")
    metric: Optional[str] = Field(None, description="全国表的指标名")
    province: Optional[str] = Field(None, description="分省表的省份名")
    years_ahead: int = Field(5, ge=1, le=10, description="预测未来年数（1-10）")
    model: str = Field("auto", description="模型选择: auto / linear / polynomial / ewm_linear")


class DataPoint(BaseModel):
    """单个数据点"""
    year: int
    value: float


class PredictionPoint(BaseModel):
    """预测数据点（含置信区间）"""
    year: int
    value: float
    lower: float
    upper: float


class ModelInfo(BaseModel):
    """模型信息"""
    name: str
    r_squared: Optional[float] = None


class TrendResponse(BaseModel):
    """趋势预测响应"""
    history: list[DataPoint]
    prediction: list[PredictionPoint]
    model_info: ModelInfo
