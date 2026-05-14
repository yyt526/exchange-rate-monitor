# 匯率監控系統 — 執行摘要

## 專案概覽

本系統每小時從 **FinMind** 取得 20 種幣別對台幣匯率，存入 **PostgreSQL**，透過 **FastAPI** REST API 提供資料，並以 **React** 儀表板呈現視覺化圖表與漲跌排行榜。

## 系統架構

```
FinMind API
    ↓ 非同步平行拉取（httpx / asyncio.gather）
ETL 服務（backend/services/etl_service.py）
    ├── 驗證資料完整性（過濾無效匯率）
    ├── 批量 Upsert → exchange_rates 表
    ├── 計算漲跌幅 change% = (today - yesterday) / yesterday × 100
    └── 排序寫入 → daily_stats 表
PostgreSQL（Neon 免費層）
    ├── exchange_rates：日匯率歷史（30 天+）
    ├── daily_stats：今日統計快取
    └── api_logs：排程執行日誌
FastAPI（Render）
    ├── GET /api/rates?currency=USD&days=30
    ├── GET /api/ranks?type=gain|loss&limit=10
    └── POST /api/refresh（觸發立即更新）
React 儀表板（Vercel）
    ├── Recharts 互動折線圖（可切換幣別 / 天數）
    ├── 漲幅排行榜 Top 10
    └── 跌幅排行榜 Top 10
```

## 核心功能

| 功能 | 實現方式 |
|------|---------|
| 資料管道 | FinMind API → 非同步並行拉取 → ETL 驗證 → 批量 Upsert |
| 自動更新 | APScheduler CronTrigger（每小時整點）|
| 視覺化圖表 | Recharts LineChart，支援 7/14/30 天切換 |
| 排行榜 | 即時排序 daily_stats，含旗幟 emoji 與顏色標示 |
| 前端輪詢 | 每小時自動 reload，支援手動立即更新 |

## 支援幣別（20 種）

USD、JPY、EUR、KRW、AUD、CAD、GBP、CHF、HKD、SGD、SEK、NOK、DKK、NZD、THB、PHP、MYR、IDR、CNY、ZAR

## 部署資訊

| 服務 | 平台 | 設定檔 |
|------|------|--------|
| 前端 | Vercel | `frontend/vercel.json` |
| 後端 | Render | `render.yaml` |
| 資料庫 | Neon PostgreSQL | 環境變數 `DATABASE_URL` |

## API 文件

啟動後端後瀏覽 `/docs`（Swagger UI 自動生成）。
