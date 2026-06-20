/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Shared workspace package is TS source; let Next transpile it.
  transpilePackages: ["@cheatercheck/types"],
};

export default nextConfig;
