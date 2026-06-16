/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: "/wedding",
  assetPrefix: "/wedding",
};

module.exports = nextConfig;
