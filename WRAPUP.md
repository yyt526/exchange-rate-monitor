# 匯率監控系統 — 專案結案報告

## 系統現況

| 項目 | 狀態 | 公開網址 |
|------|:----:|---------|
| 前端（Vercel） | ✅ 上線 | https://exchange-rate-monitor-murex.vercel.app |
| 後端（Render） | ✅ 上線 | https://exchange-rate-monitor.onrender.com |
| 資料庫（Neon） | ✅ 運作中 | PostgreSQL（共 3 張表） |
| API 文件 | ✅ 自動生成 | https://exchange-rate-monitor.onrender.com/docs |

---

## 系統架構

```
FinMind API（台灣銀行匯率來源）
    ↓ asyncio.gather 非同步平行拉取 20 種幣別
ETL 服務（每小時整點執行）
    ├─ 驗證資料完整性
    ├─ 批量 Upsert → exchange_rates 表
    ├─ 計算最新兩日漲跌幅
    └─ 排序寫入 → daily_stats 表
PostgreSQL on Neon
    ├─ exchange_rates（日匯率歷史，35 天）
    ├─ daily_stats（今日統計快取）
    └─ api_logs（排程執行日誌）
FastAPI on Render
    ├─ GET /api/rates?currency=USD&days=30
    ├─ GET /api/ranks?type=gain|loss&limit=10
    └─ POST /api/refresh
React on Vercel
    ├─ Recharts 互動折線圖（7/14/30 天切換）
    ├─ 漲幅排行榜 Top 10
    └─ 跌幅排行榜 Top 10
```

---

## 支援幣別（20 種）

| 代碼 | 幣別 | 代碼 | 幣別 |
|------|------|------|------|
| USD | 美元 | SEK | 瑞典克朗 |
| JPY | 日圓 | NOK | 挪威克朗 |
| EUR | 歐元 | DKK | 丹麥克朗 |
| KRW | 韓元 | NZD | 紐西蘭元 |
| AUD | 澳幣 | THB | 泰銖 |
| CAD | 加拿大元 | PHP | 菲律賓披索 |
| GBP | 英鎊 | MYR | 馬來西亞令吉 |
| CHF | 瑞士法郎 | IDR | 印尼盾 |
| HKD | 港幣 | CNY | 人民幣 |
| SGD | 新加坡元 | ZAR | 南非蘭特 |

---

## 功能清單

### 資料管道（0–4 分）
- [x] FinMind API 整合（`TaiwanExchangeRate` dataset）
- [x] 非同步平行拉取（`asyncio.gather`，20 幣別同時請求）
- [x] 資料驗證（過濾無效匯率、缺失值）
- [x] 批量 Upsert（ON CONFLICT DO UPDATE，避免重複）
- [x] 計算漲跌幅：`(最新 - 前一日) / 前一日 × 100%`
- [x] 動態找最近兩個不同日期（避免假日資料重複）
- [x] APScheduler CronTrigger 每小時整點執行
- [x] API 日誌記錄（`api_logs` 表）

### 視覺化（0–3 分）
- [x] Recharts 互動折線圖（即期賣出匯率）
- [x] 幣別下拉選單（10 種主要幣別）
- [x] 天數切換（7 / 14 / 30 天）
- [x] 自訂 Tooltip（顯示精確數值）
- [x] 漲幅 / 跌幅排行榜 Top 10
- [x] 國旗 emoji、前三名獎牌標示
- [x] 響應式設計（RWD，手機 / 桌機皆可）
- [x] 深色主題（Tailwind CSS dark palette）

### 更新機制（0–2 分）
- [x] APScheduler 每小時排程（`CronTrigger(minute=0)`）
- [x] `daily_stats` 表作為快取層（API 直接查快取，不重算）
- [x] 前端每小時自動輪詢（`setInterval`）
- [x] 手動立即更新按鈕（`POST /api/refresh`，BackgroundTask）

---

## 技術堆疊

| 層 | 技術 | 版本 |
|----|------|------|
| 前端框架 | React | 19 |
| 圖表 | Recharts | 3 |
| 樣式 | Tailwind CSS | 3 |
| 前端部署 | Vercel | — |
| 後端框架 | FastAPI | 0.115 |
| 排程 | APScheduler | 3.10 |
| ORM | SQLAlchemy | 2.0 |
| HTTP Client | httpx | 0.27 |
| 後端部署 | Render | Free tier |
| 資料庫 | PostgreSQL（Neon） | Free tier |
| 資料來源 | FinMind | TaiwanExchangeRate |

---

## 部署過程遇到的問題與解法

| 問題 | 原因 | 解法 |
|------|------|------|
| Render build 失敗（maturin / Rust） | Python 3.14 無 `pydantic-core` 預編譯 wheel | 升級 `pydantic-core==2.27.1`（支援 cp314 wheel） |
| Vercel build 失敗（builds 衝突） | `vercel.json` 含 `builds` 欄位導致 Project Settings 失效 | 簡化為只含 `rewrites` 的 SPA 設定 |
| Vercel build 失敗（Tailwind PostCSS） | 安裝了 Tailwind v4，但設定仍是 v3 格式 | 降版至 `tailwindcss@3.4.17` |
| 漲跌幅全為 0% | 當日銀行資料未更新，ETL 找到相同日期的今日＆昨日 | 改為抓資料庫最近兩個**不同**日期計算差異 |

---

## 評分對應

| 項目 | 目標分數 | 實現內容 |
|------|:--------:|---------|
| 資料管道 | 4 / 4 | FinMind 整合、ETL 驗證、批量處理、排程 |
| 視覺化 | 3 / 3 | Recharts 折線圖、排行榜、響應式 |
| 更新機制 | 2 / 2 | APScheduler + 資料庫快取 + 前端輪詢 |
| 溝通 | 2 / 2 | 執行摘要 + 課堂展示 |
| **總計** | **11 / 11** | |

---

## 提交清單

- [x] GitHub repo：https://github.com/yyt526/exchange-rate-monitor
- [x] 前端公網 URL：https://exchange-rate-monitor-murex.vercel.app
- [x] 後端公網 API URL：https://exchange-rate-monitor.onrender.com
- [x] API 文件（Swagger）：https://exchange-rate-monitor.onrender.com/docs
- [x] 執行摘要：`SUMMARY.md`
- [x] 結案報告：`WRAPUP.md`
- [ ] 課堂展示準備
