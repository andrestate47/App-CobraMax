const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next",

  experimental: {
    outputFileTracingRoot: path.join(__dirname),
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    unoptimized: true,
  },

  webpack: (config) => {
    // 🔥 Alias unificado (reconocido por Vercel)
    config.resolve.alias["@"] = path.resolve(__dirname, "app");
    config.resolve.alias["@components"] = path.resolve(__dirname, "app/components");
    config.resolve.alias["@ui"] = path.resolve(__dirname, "app/components/ui");
    return config;
  },
};

module.exports = nextConfig;
