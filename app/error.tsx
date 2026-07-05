"use client";

// Root error boundary. Without this, any uncaught render error anywhere in the
// app produces a blank/"Application error" white screen — which a customer would
// describe as "it kept loading / I couldn't see anything". This catches it and
// offers a recovery path instead.
import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error] caught:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#f1efef] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-gray-600 text-sm">Something went wrong on our end.</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="text-xs uppercase tracking-widest bg-gray-900 text-white px-6 py-2.5 hover:bg-gray-700 transition"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest border border-gray-900 px-6 py-2.5 hover:bg-gray-900 hover:text-white transition"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
