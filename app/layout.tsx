import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
      <body
        className={`${inter.variable} font-sans overflow-x-hidden bg-[#f1efef]`}
      >
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        <MetaPixel />
        <CartProvider>
          {children}
          <CartDrawer />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
