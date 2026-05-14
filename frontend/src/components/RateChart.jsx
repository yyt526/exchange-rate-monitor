import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useRates } from "../hooks/useRates";

const CURRENCIES = ["USD", "JPY", "EUR", "KRW", "AUD", "CAD", "GBP", "HKD", "SGD", "CNY"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-300 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-blue-400 font-mono font-semibold">
          即期賣出：{Number(p.value).toFixed(4)}
        </p>
      ))}
    </div>
  );
};

export default function RateChart() {
  const [currency, setCurrency] = useState("USD");
  const [days, setDays] = useState(30);
  const { rates, loading, error, lastUpdated, reload } = useRates(currency, days);

  const chartData = rates.map((r) => ({
    date: r.date.slice(5),    // MM-DD
    spot_sell: r.spot_sell,
  }));

  const values = chartData.map((d) => d.spot_sell).filter(Boolean);
  const minVal = values.length ? Math.min(...values) * 0.999 : 0;
  const maxVal = values.length ? Math.max(...values) * 1.001 : 100;

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl">
      {/* 標題列 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">匯率走勢圖</h2>
          {lastUpdated && (
            <p className="text-xs text-slate-400 mt-0.5">
              更新時間：{lastUpdated.toLocaleTimeString("zh-TW")}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* 幣別選擇 */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c} / TWD</option>
            ))}
          </select>
          {/* 天數選擇 */}
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === d
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {d} 天
            </button>
          ))}
          <button
            onClick={reload}
            className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            ↻ 重新整理
          </button>
        </div>
      </div>

      {/* 圖表區域 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-400">
          <p>{error}</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <p>目前無資料，請稍後再試</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#475569" }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#475569" }}
              tickFormatter={(v) => v.toFixed(2)}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="spot_sell"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#60a5fa", stroke: "#1e40af" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* 最新資訊 */}
      {!loading && !error && chartData.length > 0 && (() => {
        const last = chartData[chartData.length - 1];
        const prev = chartData[chartData.length - 2];
        const diff = prev ? last.spot_sell - prev.spot_sell : null;
        const isUp = diff !== null && diff >= 0;
        return (
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="text-slate-400">最新即期賣出</span>
              <span className="ml-2 text-white font-mono font-bold text-base">
                {last.spot_sell?.toFixed(4)}
              </span>
            </div>
            {diff !== null && (
              <div>
                <span className="text-slate-400">日變動</span>
                <span className={`ml-2 font-mono font-semibold ${isUp ? "text-green-400" : "text-red-400"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(diff).toFixed(4)}
                </span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
