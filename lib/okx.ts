import crypto from "crypto";
import { fetchWithTimeout, readableFetchError } from "./http";
import type { BalanceSource } from "./types";

type OkxDetail = {
  ccy: string;
  eq?: string;
  cashBal?: string;
  availBal?: string;
};

function signature(secret: string, timestamp: string, method: string, path: string): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}${method}${path}`).digest("base64");
}

function amount(details: OkxDetail[], currency: string): number {
  const row = details.find((item) => item.ccy === currency);
  if (!row) return 0;
  return Number(row.eq || row.cashBal || row.availBal || 0);
}

export async function fetchOkxBalances(baseUrl: string, projectId: string): Promise<BalanceSource> {
  const key = process.env.OKX_API_KEY;
  const secret = process.env.OKX_API_SECRET;
  const passphrase = process.env.OKX_API_PASSPHRASE;
  if (!key || !secret || !passphrase) {
    return { source: "okx", btc: 0, usdc: 0, ok: false, error: "missing OKX secrets" };
  }

  const path = "/api/v5/account/balance";
  const timestamp = new Date().toISOString();
  const headers: Record<string, string> = {
    "OK-ACCESS-KEY": key,
    "OK-ACCESS-SIGN": signature(secret, timestamp, "GET", path),
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": passphrase,
  };
  if (projectId) headers["OK-ACCESS-PROJECT"] = projectId;

  let response: Response;
  try {
    response = await fetchWithTimeout(`${baseUrl}${path}`, { headers, cache: "no-store" });
  } catch (error) {
    return { source: "okx", btc: 0, usdc: 0, ok: false, error: readableFetchError(error) };
  }
  if (!response.ok) {
    return { source: "okx", btc: 0, usdc: 0, ok: false, error: `OKX ${response.status}` };
  }

  const payload = (await response.json()) as { code: string; msg?: string; data?: Array<{ details?: OkxDetail[] }> };
  if (payload.code !== "0") {
    return { source: "okx", btc: 0, usdc: 0, ok: false, error: payload.msg || `OKX code ${payload.code}` };
  }

  const details = payload.data?.[0]?.details || [];
  return {
    source: "okx",
    btc: amount(details, "BTC"),
    usdc: amount(details, "USDC") + amount(details, "USDT"),
    ok: true,
  };
}
