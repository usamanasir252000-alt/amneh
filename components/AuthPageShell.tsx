"use client";

import Footer from "@/components/Footer";
import { ReactNode } from "react";

interface AuthPageShellProps {
  children: ReactNode;
}

export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-[#f4e9ec] text-[#564047]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">{children}</div>
        <Footer />
      </div>
    </main>
  );
}
