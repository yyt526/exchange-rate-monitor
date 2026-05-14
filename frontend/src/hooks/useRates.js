import { useState, useEffect, useCallback } from "react";
import { fetchRates, fetchRanks } from "../utils/api";

const POLL_INTERVAL = 60 * 60 * 1000; // 每小時輪詢

export function useRates(currency = "USD", days = 30) {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchRates(currency, days);
      setRates(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || "資料載入失敗");
    } finally {
      setLoading(false);
    }
  }, [currency, days]);

  useEffect(() => {
    setLoading(true);
    load();
    const timer = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  return { rates, loading, error, lastUpdated, reload: load };
}

export function useRanks() {
  const [gainRanks, setGainRanks] = useState([]);
  const [lossRanks, setLossRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [gain, loss] = await Promise.all([
        fetchRanks("gain", 10),
        fetchRanks("loss", 10),
      ]);
      setGainRanks(gain);
      setLossRanks(loss);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || "排行榜載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
    const timer = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  return { gainRanks, lossRanks, loading, error, lastUpdated, reload: load };
}
