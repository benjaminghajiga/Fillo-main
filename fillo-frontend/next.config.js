/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: "https://resplendent-creativity-production.up.railway.app/api",
    NEXT_PUBLIC_STACKS_NETWORK: process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet",
  },
};

module.exports = nextConfig;
