import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MetaPixel from "@/components/MetaPixel";

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
    title: "amneh.",
    description:
      "Luxury beauty essentials crafted to elevate your glow with confidence and elegance.",
    type: "website",
    images: ["/amneh.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "amneh.",
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
        {/* Cuts DNS/TLS handshake time off the first request to each origin. */}
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://cdn.shopify.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://vercel.live" />
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
        {/*
          overflow-x-hidden lives on this wrapper, NOT <body>/<html>. Setting it
          directly on body breaks vertical scrolling entirely in Facebook's
          in-app browser (a known WebView bug) — it worked in Instagram's
          in-app browser and regular mobile browsers, but froze scroll on every
          page when opened from a Facebook ad.
        */}
        <div className="overflow-x-hidden">
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
