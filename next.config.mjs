/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },

  /**
   * على ويندوز (وخاصة المشروع تحت OneDrive/«Downloads») مراقبة الملفات الافتراضية أحياناً
   * لا تستشعر التغييرات — فيُفضّل polling في وضع `next dev` فقط.
   * لإلغائه: عيّن `NEXT_DISABLE_WEBPACK_POLL=1` في البيئة.
   */
  webpack: (config, { dev, isServer: _isServer }) => {
    if (dev) {
      const disable = process.env.NEXT_DISABLE_WEBPACK_POLL === "1" || process.env.NEXT_DISABLE_WEBPACK_POLL === "true";
      const isWin = process.platform === "win32";
      if (!disable && (isWin || process.env.NEXT_ENABLE_WEBPACK_POLL === "1")) {
        config.watchOptions = {
          ...config.watchOptions,
          poll: 800,
          aggregateTimeout: 500,
          ignored: ["**/node_modules/**", "**/.git/**", "**/node_modules"],
        };
      }
    }
    return config;
  },
};

export default nextConfig;
