import { DashboardClient } from "./dashboard-client";
import { buildDashboardSnapshot } from "../lib/snapshot";

export const dynamic = "force-dynamic";

export default async function Page() {
  const snapshot = await buildDashboardSnapshot();
  return <DashboardClient snapshot={snapshot} />;
}
