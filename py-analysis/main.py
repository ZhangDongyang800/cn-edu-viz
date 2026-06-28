"""FastAPI 分析服务入口"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.request import TrendRequest, TrendResponse
from services.trend import predict_trend
from db import get_available_metrics, get_available_provinces, NATIONAL_TABLES, PROVINCIAL_TABLES, ALLOWED_TABLES

app = FastAPI(title="教育数据分析服务", version="1.0.0")

# 允许 Node.js 后端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {"status": "ok"}


@app.get("/analysis/available-tables")
async def available_tables():
    """获取可分析的数据表列表，含类型和可用指标/省份"""
    result = []
    for table in ALLOWED_TABLES:
        info = {"name": table, "type": "national" if table in NATIONAL_TABLES else "provincial"}
        if table in NATIONAL_TABLES:
            info["metrics"] = get_available_metrics(table)
        if table in PROVINCIAL_TABLES:
            info["provinces"] = get_available_provinces(table)
        result.append(info)
    return result


@app.post("/analysis/trend", response_model=TrendResponse)
async def trend_analysis(req: TrendRequest):
    """趋势预测接口"""
    try:
        return predict_trend(
            table=req.table,
            metric=req.metric,
            province=req.province,
            years_ahead=req.years_ahead,
            model=req.model,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"预测失败: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    from config import FASTAPI_PORT
    uvicorn.run("main:app", host="0.0.0.0", port=FASTAPI_PORT, reload=True)
