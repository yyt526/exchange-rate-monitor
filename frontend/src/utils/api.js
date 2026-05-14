import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_BASE });

export async function fetchRates(currency = "USD", days = 30) {
  const { data } = await api.get("/api/rates", { params: { currency, days } });
  return data;
}

export async function fetchRanks(type = "gain", limit = 10) {
  const { data } = await api.get("/api/ranks", { params: { type, limit } });
  return data;
}

export async function triggerRefresh() {
  const { data } = await api.post("/api/refresh");
  return data;
}
