"use client";

// Root-level error boundary. Unlike app/error.tsx (which renders INSIDE the
// root layout), this catches errors thrown by the root layout itself — the
// worst case, a fully blank white screen. It must supply its own <html>/<body>
// because the crashing layout's markup is unavailable. Kept deliberately
// minimal and dependency-free so it can render even when higher-level code
// (Navbar, providers, fonts) is what broke.
import { useEffect } from "react";
import { phCaptureException } from "@/lib/posthog";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/global-error] caught:", error);
    phCaptureException(error, { boundary: "app/global-error", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#f1efef", fontFamily: "system-ui, sans-serif" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#4b5563", fontSize: "0.875rem" }}>
            Something went wrong on our end.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={reset}
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                background: "#111827",
                color: "#fff",
                padding: "0.625rem 1.5rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                border: "1px solid #111827",
                color: "#111827",
                padding: "0.625rem 1.5rem",
                textDecoration: "none",
              }}
            >
              Back to Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
