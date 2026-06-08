import { fetchWithTimeout } from "./http";

export async function fetchBinanceDailyCloses(baseUrl: string, symbol: string, limit: number): Promise<number[]> {
  const response = await fetchWithTimeout(`${baseUrl}/api/v3/klines?symbol=${symbol}&interval=1d&limit=${limit}`, {
    cache: "no-store",
  }, 12000);
  if (!response.ok) {
    throw new Error(`Binance klines ${response.status}`);
  }
  const rows = (await response.json()) as unknown[][];
  return rows.map((row) => Number(row[4])).filter(Number.isFinite);
}
