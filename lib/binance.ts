import crypto from "crypto";
import { fetchWithTimeout, readableFetchError } from "./http";
import type { BalanceSource } from "./types";

type BinanceBalance = {
  asset: string;
  free: string;
  locked: string;
};

function sign(secret: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  const signature = crypto.createHmac("sha256", secret).update(query).digest("hex");
  return `${query}&signature=${signature}`;
}

function balanceOf(balances: BinanceBalance[], asset: string): number {
  const row = balances.find((item) => item.asset === asset);
  if (!row) return 0;
  return Number(row.free) + Number(row.locked);
}

export async function fetchBinanceBalances(baseUrl: string): Promise<BalanceSource> {
  const key = process.env.BINANCE_API_KEY;
  const secret = process.env.BINANCE_API_SECRET;
  if (!key || !secret) {
    return { source: "binance", btc: 0, usdc: 0, ok: false, error: "missing Binance secrets" };
  }

  let response: Response;
  try {
    const query = sign(secret, { timestamp: String(Date.now()), recvWindow: "5000" });
    response = await fetchWithTimeout(`${baseUrl}/api/v3/account?${query}`, {
      headers: { "X-MBX-APIKEY": key },
      cache: "no-store",
    });
    if (!response.ok) {
      return { source: "binance", btc: 0, usdc: 0, ok: false, error: `Binance ${response.status}` };
    }
  } catch (error) {
    return { source: "binance", btc: 0, usdc: 0, ok: false, error: readableFetchError(error) };
  }

  const account = (await response.json()) as { balances?: BinanceBalance[] };
  const balances = account.balances || [];
  return {
    source: "binance",
    btc: balanceOf(balances, "BTC"),
    usdc: balanceOf(balances, "USDC") + balanceOf(balances, "USDT"),
    ok: true,
  };
}

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
