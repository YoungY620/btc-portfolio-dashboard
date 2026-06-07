import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "BTC Portfolio Dashboard",
  description: "BTC/USDC strategy allocation dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
