import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ngrok 等のトンネル経由でローカル開発サーバーにアクセスする際の許可オリジン
  // （LIFF 実機テスト用）。本番には影響しない。
  allowedDevOrigins: ["monotype-bungee-province.ngrok-free.dev"],
};

export default nextConfig;
