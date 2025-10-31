const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 📦 Directorio de salida (donde Next genera los archivos de build)
  distDir: ".next",

  // ⚙️ Configuración experimental para tracing (evita rutas duplicadas como app/app/.next)
  experimental: {
    outputFileTracingRoot: path.join(__dirname),
  },

  // 🚫 Evita que el build falle por errores de ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Mantiene la verificación de tipos TypeScript (mejor dejarla activa)
  typescript: {
    ignoreBuildErrors: false,
  },

  // 🖼️ Desactiva la optimización de imágenes (útil si no usas next/image o AWS)
  images: {
    unoptimized: true,
  },

  // 🧭 Agrega alias global para rutas absolutas desde /app
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "app");
    return config;
  },
};

module.exports = nextConfig;
