/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kill-switch/shared'],
  output: 'standalone',
};

module.exports = nextConfig;

