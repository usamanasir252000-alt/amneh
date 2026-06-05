import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "amneh. — Luxury Beauty",
  description: "Premium beauty products crafted for elegance and confidence.",
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
        <CartProvider>
          {children}
          <CartDrawer />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
