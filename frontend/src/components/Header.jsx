import React from "react";
import { triggerRefresh } from "../utils/api";

export default function Header({ onRefresh }) {
  const [refreshing, setRefreshing] = React.useState(false);
  const [msg, setMsg] = React.useState(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setMsg(null);
    try {
      const res = await triggerRefresh();
      setMsg(res.status || "更新已觸發");
      onRefresh?.();
    } catch {
      setMsg("觸發失敗，請稍後再試");
    } finally {
      setRefreshing(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            💱 匯率監控儀表板
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            即時追蹤多幣別對台幣匯率，每小時自動更新
          </p>
        </div>
        <div className="flex items-center gap-3">
          {msg && (
            <span className="text-sm text-blue-400 animate-pulse">{msg}</span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <span className={refreshing ? "animate-spin" : ""}>↻</span>
            {refreshing ? "更新中..." : "立即更新"}
          </button>
        </div>
      </div>
    </header>
  );
}
