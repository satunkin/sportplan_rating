import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/cabinet/admin-login",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
