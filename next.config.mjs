const nextConfig = {
  reactStrictMode: true,
  images: {
    qualities: [75, 90, 100],
    formats: ["image/avif", "image/webp"],
    // Next's default imageSizes tops out at 384, then jumps straight to
    // deviceSizes' 640 — any image whose real rendered width falls in that
    // 384-640px gap (product-card thumbnails on this site commonly render
    // around 405-486px) gets rounded up to 640 regardless of how accurate
    // its `sizes` prop is, sending noticeably more bytes than needed. Adding
    // 480 closes that gap (PageSpeed flagged this exact "640x799 requested
    // for 405x542 displayed" waste on the Most Loved product cards).
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 480],
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
  // Meta's ad crawler (meta-externalads) and any catalog/dynamic ad whose feed
  // still uses Shopify's `/products/{handle}.json` URL shape hit our custom
  // Next.js storefront — which has no `.json` route — and 404. Redirect those
  // to the real product page so both the crawler AND any real customer who
  // clicks such an ad land on the working page instead of a 404.
  async redirects() {
    return [
      {
        source: "/products/:handle.json",
        destination: "/products/:handle",
        permanent: true,
      },
    ];
  },
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
