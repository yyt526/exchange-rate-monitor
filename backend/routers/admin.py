from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.services.etl_service import run_etl

router = APIRouter(prefix="/api", tags=["管理"])


@router.post("/refresh")
async def refresh(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """觸發立即更新（管理員用）。"""
    background_tasks.add_task(run_etl, db)
    return {"status": "已排入更新任務，請稍後查詢結果"}
