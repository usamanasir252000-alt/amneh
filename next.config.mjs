const nextConfig = {
  reactStrictMode: true,
  images: {
    qualities: [75, 90, 100],
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
};

export default nextConfig;
