"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { ReactNode } from "react";

interface AuthPageShellProps {
  children: ReactNode;
}

export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-transparent text-[#564047]">
      <Navbar />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-4 pt-28 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">{children}</div>
        <Footer />
      </div>
    </main>
  );
}
