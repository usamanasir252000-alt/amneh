import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Beautli — Luxury Beauty Shopify Store",
  description:
    "Premium beauty landing page built with Next.js, Tailwind CSS and Framer Motion.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} overflow-x-hidden bg-[#f6d1d8]`}>
        {children}
      </body>
    </html>
  );
}
