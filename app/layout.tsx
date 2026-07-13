import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import AnnouncementBar from "@/components/AnnouncementBar";
import WhatsAppButton from "@/components/WhatsAppButton";
import MetaPixel from "@/components/MetaPixel";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import MicrosoftClarity from "@/components/MicrosoftClarity";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Amneh | Best Skincare Brand in Pakistan",
  description:
    "Luxury beauty essentials crafted to elevate your glow with confidence and elegance.",
  icons: {
    icon: "/amneh.png",
    apple: "/amneh.png",
    shortcut: "/amneh.png",
  },
  openGraph: {
    title: "Amneh | Best Skincare Brand in Pakistan",
    description:
      "Luxury beauty essentials crafted to elevate your glow with confidence and elegance.",
    type: "website",
    images: ["/amneh.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amneh | Best Skincare Brand in Pakistan",
    description:
      "Luxury beauty essentials crafted to elevate your glow with confidence and elegance.",
    images: ["/amneh.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/*
          Cuts DNS/TLS handshake time off the first request to each origin —
          kept to only origins the BROWSER itself actually talks to. Shopify
          product images and Cloudinary uploads never qualify: Shopify images
          go through Next's /_next/image proxy (the Next.js SERVER fetches
          cdn.shopify.com, not the browser), and the one place Cloudinary is
          used client-side (admin product image upload) hits a completely
          different subdomain (api.cloudinary.com, not res.cloudinary.com) —
          so preconnecting either on customer-facing pages was pure dead
          weight, confirmed by PageSpeed Insights flagging both as unused on
          every page tested.
        */}
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://www.facebook.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.clarity.ms" />
        {/*
          shop.amnehofficial.com is Shopify's checkout domain — a completely
          different origin from this app that the browser has never talked to.
          Buy Now / checkout redirect there cold: fresh DNS + TLS handshake
          happening at the exact moment the customer is waiting to see a page.
          Warming the connection here means that handshake is already done by
          the time they click, instead of adding to the "checkout keeps
          loading" delay on a slow connection.
        */}
        <link rel="preconnect" href="https://shop.amnehofficial.com" />
      </head>
      <body className={`${inter.variable} font-sans bg-[#f1efef]`}>
        <MetaPixel />
        <GoogleAnalytics />
        <MicrosoftClarity />
        {/*
          overflow-x-hidden lives on this wrapper, NOT <body>/<html>. Setting it
          directly on body breaks vertical scrolling entirely in Facebook's
          in-app browser (a known WebView bug) — it worked in Instagram's
          in-app browser and regular mobile browsers, but froze scroll on every
          page when opened from a Facebook ad.
        */}
        <div className="overflow-x-hidden">
          <AnnouncementBar />
          <CartProvider>
            {children}
            <CartDrawer />
            <WhatsAppButton />
          </CartProvider>
        </div>
      </body>
    </html>
  );
}
