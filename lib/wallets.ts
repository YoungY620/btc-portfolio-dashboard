import { fetchWithTimeout, readableFetchError } from "./http";
import type { BalanceSource } from "./types";

type BlockstreamAddress = {
  chain_stats: { funded_txo_sum: number; spent_txo_sum: number };
  mempool_stats: { funded_txo_sum: number; spent_txo_sum: number };
};

export async function fetchBtcWalletBalance(address: string): Promise<BalanceSource> {
  let response: Response;
  try {
    response = await fetchWithTimeout(`https://blockstream.info/api/address/${address}`, {
      cache: "no-store",
    });
  } catch (error) {
    return { source: `btc_wallet:${address}`, btc: 0, usdc: 0, ok: false, error: readableFetchError(error) };
  }
  if (!response.ok) {
    return { source: `btc_wallet:${address}`, btc: 0, usdc: 0, ok: false, error: `wallet ${response.status}` };
  }

  const payload = (await response.json()) as BlockstreamAddress;
  const confirmed = payload.chain_stats.funded_txo_sum - payload.chain_stats.spent_txo_sum;
  const mempool = payload.mempool_stats.funded_txo_sum - payload.mempool_stats.spent_txo_sum;
  return {
    source: `btc_wallet:${address}`,
    btc: (confirmed + mempool) / 100_000_000,
    usdc: 0,
    ok: true,
  };
}
