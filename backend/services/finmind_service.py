import httpx
import os
from datetime import date, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

FINMIND_BASE_URL = "https://api.finmindtrade.com/api/v4/data"
FINMIND_TOKEN = os.getenv("FINMIND_TOKEN", "")

# 台灣銀行支援幣別對應 FinMind dataset 名稱
# FinMind 使用 TaiwanExchangeRate dataset，幣別代碼如下
SUPPORTED_CURRENCIES = [
    "USD", "JPY", "EUR", "KRW", "AUD", "CAD", "GBP", "CHF", "HKD", "SGD",
    "SEK", "NOK", "DKK", "NZD", "THB", "PHP", "MYR", "IDR", "CNY", "ZAR",
]


async def fetch_exchange_rates(
    currency: str,
    start_date: date,
    end_date: date,
) -> list[dict]:
    """從 FinMind 取得指定幣別與日期範圍的匯率資料。"""
    params = {
        "dataset": "TaiwanExchangeRate",
        "data_id": currency,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
    }
    if FINMIND_TOKEN:
        params["token"] = FINMIND_TOKEN

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(FINMIND_BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    if data.get("status") != 200:
        logger.warning(f"FinMind API 回傳非 200 狀態: {data.get('msg')} (幣別={currency})")
        return []

    records = data.get("data", [])
    return records


async def fetch_all_currencies(days: int = 35) -> dict[str, list[dict]]:
    """平行取得所有支援幣別的匯率資料，回傳 {currency: [records]}。"""
    import asyncio

    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    results: dict[str, list[dict]] = {}

    async def fetch_one(currency: str):
        try:
            records = await fetch_exchange_rates(currency, start_date, end_date)
            results[currency] = records
            logger.info(f"取得 {currency} 共 {len(records)} 筆")
        except Exception as e:
            logger.error(f"取得 {currency} 失敗: {e}")
            results[currency] = []

    await asyncio.gather(*[fetch_one(c) for c in SUPPORTED_CURRENCIES])
    return results
