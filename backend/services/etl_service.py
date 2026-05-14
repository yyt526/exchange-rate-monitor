from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
import logging

from backend.models.database import ExchangeRate, DailyStat, ApiLog
from backend.services.finmind_service import fetch_all_currencies

logger = logging.getLogger(__name__)


def _parse_float(value) -> float | None:
    try:
        v = float(value)
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None


def _upsert_exchange_rates(db: Session, currency: str, records: list[dict]) -> int:
    """批量 upsert exchange_rates，回傳成功筆數。"""
    rows = []
    for r in records:
        raw_date = r.get("date")
        if not raw_date:
            continue
        try:
            d = date.fromisoformat(str(raw_date)[:10])
        except ValueError:
            continue

        spot_buy = _parse_float(r.get("SpotBuy") or r.get("spot_buy"))
        spot_sell = _parse_float(r.get("SpotSell") or r.get("spot_sell"))
        cash_buy = _parse_float(r.get("CashBuy") or r.get("cash_buy"))
        cash_sell = _parse_float(r.get("CashSell") or r.get("cash_sell"))

        # 至少需要一個有效匯率才存入
        if all(v is None for v in [spot_buy, spot_sell, cash_buy, cash_sell]):
            continue

        rows.append({
            "date": d,
            "currency": currency,
            "spot_buy": spot_buy,
            "spot_sell": spot_sell,
            "cash_buy": cash_buy,
            "cash_sell": cash_sell,
        })

    if not rows:
        return 0

    stmt = pg_insert(ExchangeRate).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["date", "currency"],
        set_={
            "spot_buy": stmt.excluded.spot_buy,
            "spot_sell": stmt.excluded.spot_sell,
            "cash_buy": stmt.excluded.cash_buy,
            "cash_sell": stmt.excluded.cash_sell,
        },
    )
    db.execute(stmt)
    db.commit()
    return len(rows)


def _get_rate_for_date(db: Session, currency: str, target_date: date) -> float | None:
    """取得指定幣別在特定日期的 spot_sell 匯率（往前找最近一筆）。"""
    for delta in range(5):
        d = target_date - timedelta(days=delta)
        row = (
            db.query(ExchangeRate)
            .filter(ExchangeRate.currency == currency, ExchangeRate.date == d)
            .first()
        )
        if row and row.spot_sell:
            return row.spot_sell
    return None


def _compute_daily_stats(db: Session) -> list[dict]:
    """計算各幣別今日 vs 昨日漲跌幅，回傳統計列表。"""
    today = date.today()
    yesterday = today - timedelta(days=1)

    stats = []
    currencies = db.query(ExchangeRate.currency).distinct().all()
    for (currency,) in currencies:
        today_rate = _get_rate_for_date(db, currency, today)
        yesterday_rate = _get_rate_for_date(db, currency, yesterday)

        if today_rate is None or yesterday_rate is None or yesterday_rate == 0:
            change_pct = None
        else:
            change_pct = (today_rate - yesterday_rate) / yesterday_rate * 100

        stats.append({
            "currency": currency,
            "today_date": today,
            "yesterday_rate": yesterday_rate,
            "today_rate": today_rate,
            "change_pct": change_pct,
        })

    # 計算排名
    valid = [s for s in stats if s["change_pct"] is not None]
    sorted_gain = sorted(valid, key=lambda x: x["change_pct"], reverse=True)
    sorted_loss = sorted(valid, key=lambda x: x["change_pct"])

    gain_rank = {s["currency"]: i + 1 for i, s in enumerate(sorted_gain)}
    loss_rank = {s["currency"]: i + 1 for i, s in enumerate(sorted_loss)}

    for s in stats:
        s["rank_gain"] = gain_rank.get(s["currency"])
        s["rank_loss"] = loss_rank.get(s["currency"])

    return stats


def _upsert_daily_stats(db: Session, stats: list[dict]):
    """Upsert daily_stats 表。"""
    for s in stats:
        stmt = pg_insert(DailyStat).values(**s)
        stmt = stmt.on_conflict_do_update(
            index_elements=["currency"],
            set_={k: v for k, v in s.items() if k != "currency"},
        )
        db.execute(stmt)
    db.commit()


def _log_api(db: Session, status: str, message: str):
    log = ApiLog(status=status, message=message)
    db.add(log)
    db.commit()


async def run_etl(db: Session):
    """主要 ETL 流程：拉取資料 → 驗證 → 存入 DB → 計算統計。"""
    logger.info("ETL 開始執行")
    total_rows = 0
    errors = []

    try:
        all_data = await fetch_all_currencies(days=35)
    except Exception as e:
        _log_api(db, "error", f"FinMind 拉取失敗: {e}")
        raise

    for currency, records in all_data.items():
        if not records:
            errors.append(f"{currency}: 無資料")
            continue
        try:
            n = _upsert_exchange_rates(db, currency, records)
            total_rows += n
        except Exception as e:
            logger.error(f"{currency} 存入失敗: {e}")
            errors.append(f"{currency}: {e}")

    # 計算並更新 daily_stats
    try:
        stats = _compute_daily_stats(db)
        _upsert_daily_stats(db, stats)
    except Exception as e:
        logger.error(f"計算統計失敗: {e}")
        _log_api(db, "error", f"統計計算失敗: {e}")
        raise

    msg = f"ETL 完成：共更新 {total_rows} 筆匯率資料"
    if errors:
        msg += f"，{len(errors)} 個幣別發生錯誤"
    _log_api(db, "success", msg)
    logger.info(msg)
    return {"total_rows": total_rows, "errors": errors, "message": msg}
