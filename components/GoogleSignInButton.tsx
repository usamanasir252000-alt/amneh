"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Module-level flag so initialize() is only called once per page load
let gsiInitialized = false;

interface GoogleSignInButtonProps {
  onClose?: () => void;
}

export default function GoogleSignInButton({ onClose }: GoogleSignInButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");

  // Keep onClose/router in a ref so the callback never goes stale
  const onCloseRef = useRef(onClose);
  const routerRef = useRef(router);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { routerRef.current = router; }, [router]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const render = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      if (!gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: { credential?: string }) => {
            if (!response?.credential) {
              setError("Google authentication failed.");
              return;
            }
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_token: response.credential }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              setError(data.error || "Google login failed.");
              return;
            }
            onCloseRef.current?.();
            routerRef.current.push("/");
          },
        });
        gsiInitialized = true;
      }

      // renderButton is safe to call on every mount
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: buttonRef.current.offsetWidth || 360,
      });
    };

    // Script already loaded (loaded by layout.tsx Script tag)
    if (window.google?.accounts?.id) {
      render();
    } else {
      // Poll briefly in case the layout script hasn't finished yet
      const id = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(id);
          render();
        }
      }, 100);
      return () => clearInterval(id);
    }
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="space-y-2">
      <div ref={buttonRef} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
