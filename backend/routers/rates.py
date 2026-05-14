from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Literal
from pydantic import BaseModel

from backend.models.database import get_db, ExchangeRate, DailyStat

router = APIRouter(prefix="/api", tags=["匯率"])


class RateOut(BaseModel):
    date: date
    currency: str
    spot_buy: float | None
    spot_sell: float | None
    cash_buy: float | None
    cash_sell: float | None

    class Config:
        from_attributes = True


class RankOut(BaseModel):
    rank: int
    currency: str
    yesterday_rate: float | None
    today_rate: float | None
    change_pct: float | None


@router.get("/rates", response_model=list[RateOut])
def get_rates(
    currency: str = Query(default="USD", description="幣別代碼，例如 USD"),
    days: int = Query(default=30, ge=1, le=365, description="查詢天數"),
    db: Session = Depends(get_db),
):
    start = date.today() - timedelta(days=days)
    rows = (
        db.query(ExchangeRate)
        .filter(ExchangeRate.currency == currency.upper(), ExchangeRate.date >= start)
        .order_by(ExchangeRate.date.asc())
        .all()
    )
    return rows


@router.get("/ranks", response_model=list[RankOut])
def get_ranks(
    type: Literal["gain", "loss"] = Query(default="gain", description="gain=漲幅 / loss=跌幅"),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    rows = db.query(DailyStat).filter(DailyStat.change_pct.isnot(None)).all()

    if type == "gain":
        sorted_rows = sorted(rows, key=lambda x: x.change_pct, reverse=True)
        rank_attr = "rank_gain"
    else:
        sorted_rows = sorted(rows, key=lambda x: x.change_pct)
        rank_attr = "rank_loss"

    result = []
    for i, row in enumerate(sorted_rows[:limit], start=1):
        result.append(RankOut(
            rank=i,
            currency=row.currency,
            yesterday_rate=row.yesterday_rate,
            today_rate=row.today_rate,
            change_pct=round(row.change_pct, 4) if row.change_pct is not None else None,
        ))
    return result
