import React, { useCallback, useState } from "react";
import Header from "./components/Header";
import RateChart from "./components/RateChart";
import RankTable from "./components/RankTable";
import { useRanks } from "./hooks/useRates";
import "./index.css";

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { gainRanks, lossRanks, loading, error, lastUpdated, reload } = useRanks();

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    reload();
  }, [reload]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Header onRefresh={handleRefresh} />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 匯率走勢圖 */}
        <RateChart key={refreshKey} />

        {/* 更新時間 */}
        {lastUpdated && (
          <p className="text-center text-xs text-slate-500">
            排行榜最後更新：{lastUpdated.toLocaleString("zh-TW")}
          </p>
        )}

        {/* 排行榜 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RankTable
            title="漲幅排行榜 Top 5"
            data={gainRanks}
            type="gain"
            loading={loading}
            error={error}
          />
          <RankTable
            title="跌幅排行榜 Top 5"
            data={lossRanks}
            type="loss"
            loading={loading}
            error={error}
          />
        </div>
      </main>

      <footer className="text-center text-slate-600 text-xs py-6 border-t border-slate-800 mt-8">
        資料來源：FinMind｜每小時自動更新
      </footer>
    </div>
  );
}
