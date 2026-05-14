import logging
import os
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.models.database import SessionLocal, init_db
from backend.routers import rates, admin
from backend.services.etl_service import run_etl

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def scheduled_etl():
    db = SessionLocal()
    try:
        await run_etl(db)
    except Exception as e:
        logger.error(f"排程 ETL 失敗: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 啟動時初始化資料庫並執行第一次 ETL
    init_db()
    logger.info("資料庫初始化完成")

    scheduler.add_job(
        scheduled_etl,
        CronTrigger(minute=0),  # 每小時整點執行
        id="hourly_etl",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler 排程啟動（每小時整點更新）")

    # 啟動後立即執行一次，確保資料就緒
    await scheduled_etl()

    yield

    scheduler.shutdown()
    logger.info("APScheduler 已停止")


app = FastAPI(
    title="匯率監控 API",
    description="提供 USD/TWD 及多幣別匯率資料與漲跌排行榜",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 設定：允許前端 Vercel 網域
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://*.vercel.app",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 生產環境請改為 ALLOWED_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rates.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "匯率監控 API 運作中", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
