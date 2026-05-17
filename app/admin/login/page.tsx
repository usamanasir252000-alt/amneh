"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin/products");
    } else {
      setError("Invalid password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf5f6] flex items-center justify-center">
      <div className="w-full max-w-sm bg-white shadow-sm rounded-lg p-8">
        <div className="mb-8 text-center">
          <img src="/logo.svg" alt="amneh." className="h-8 mx-auto mb-2" />
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-3">Admin Panel</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-gray-400 rounded"
            required
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 text-xs uppercase tracking-widest hover:bg-gray-700 transition disabled:opacity-50 rounded"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
