import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true });
  // Expire the session cookie. Must match the name used by login/register
  // ("session") and the same path, otherwise the browser keeps it.
  res.cookies.set("session", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  // Clear the legacy name too, just in case any old cookie is lingering.
  res.cookies.delete("user-session");
  return res;
}
