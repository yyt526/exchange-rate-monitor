import React from "react";

const FLAG_MAP = {
  USD: "🇺🇸", JPY: "🇯🇵", EUR: "🇪🇺", KRW: "🇰🇷", AUD: "🇦🇺",
  CAD: "🇨🇦", GBP: "🇬🇧", CHF: "🇨🇭", HKD: "🇭🇰", SGD: "🇸🇬",
  SEK: "🇸🇪", NOK: "🇳🇴", DKK: "🇩🇰", NZD: "🇳🇿", THB: "🇹🇭",
  PHP: "🇵🇭", MYR: "🇲🇾", IDR: "🇮🇩", CNY: "🇨🇳", ZAR: "🇿🇦",
};

function RankRow({ item, type }) {
  const isGain = type === "gain";
  const changeColor = isGain ? "text-green-400" : "text-red-400";
  const rankBadge =
    item.rank <= 3
      ? ["text-yellow-400", "text-slate-300", "text-orange-400"][item.rank - 1]
      : "text-slate-400";

  return (
    <tr className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
      <td className={`py-2.5 px-3 text-center font-bold text-sm ${rankBadge}`}>
        {item.rank <= 3 ? ["🥇", "🥈", "🥉"][item.rank - 1] : item.rank}
      </td>
      <td className="py-2.5 px-3">
        <span className="text-base mr-1">{FLAG_MAP[item.currency] || "🏳️"}</span>
        <span className="font-semibold text-white">{item.currency}</span>
        <span className="text-slate-400 text-xs ml-1">/ TWD</span>
      </td>
      <td className="py-2.5 px-3 text-right font-mono text-slate-300 text-sm">
        {item.yesterday_rate != null ? item.yesterday_rate.toFixed(4) : "—"}
      </td>
      <td className="py-2.5 px-3 text-right font-mono text-white text-sm">
        {item.today_rate != null ? item.today_rate.toFixed(4) : "—"}
      </td>
      <td className={`py-2.5 px-3 text-right font-mono font-bold text-sm ${changeColor}`}>
        {item.change_pct != null
          ? `${isGain ? "+" : ""}${item.change_pct.toFixed(2)}%`
          : "—"}
      </td>
    </tr>
  );
}

export default function RankTable({ title, data, type, loading, error }) {
  const isGain = type === "gain";
  const headerColor = isGain ? "text-green-400" : "text-red-400";
  const borderColor = isGain ? "border-green-500" : "border-red-500";
  const icon = isGain ? "📈" : "📉";

  return (
    <div className={`bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border-t-2 ${borderColor}`}>
      <div className="px-5 py-4 border-b border-slate-700">
        <h3 className={`text-lg font-bold ${headerColor}`}>
          {icon} {title}
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-48 text-red-400 text-sm">
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          暫無資料
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wide bg-slate-900/40">
                <th className="py-2.5 px-3 text-center">排名</th>
                <th className="py-2.5 px-3 text-left">幣別</th>
                <th className="py-2.5 px-3 text-right">昨日匯率</th>
                <th className="py-2.5 px-3 text-right">今日匯率</th>
                <th className="py-2.5 px-3 text-right">漲跌幅</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <RankRow key={item.currency} item={item} type={type} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
