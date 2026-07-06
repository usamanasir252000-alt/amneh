const nextConfig = {
  reactStrictMode: true,
  images: {
    qualities: [75, 90, 100],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
  // Deliberately NOT including Content-Security-Policy here — a misconfigured
  // CSP can silently break the Meta Pixel, Google Sign-In, Shopify/Cloudinary
  // images, or the WhatsApp link. That needs its own careful pass with real
  // testing, not a blanket header. These are safe, purely-additive headers.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
