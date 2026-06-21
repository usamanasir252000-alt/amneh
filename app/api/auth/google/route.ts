import { NextResponse } from "next/server";
import { registerCustomer, loginCustomer } from "@/lib/shopify-storefront-auth";
import { tagCustomer } from "@/lib/shopify-admin";
import { signToken } from "@/lib/jwt";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { id_token } = await request.json();
  if (!id_token) {
    return NextResponse.json({ error: "Missing id_token" }, { status: 400 });
  }

  const verify = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`
  );
  if (!verify.ok) {
    return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
  }
  const info = await verify.json();
  const email = info.email as string | undefined;
  const email_verified =
    info.email_verified === "true" || info.email_verified === true;
  if (!email || !email_verified) {
    return NextResponse.json({ error: "Google email not verified" }, { status: 401 });
  }

  const firstName = info.given_name ?? info.name ?? "";
  const lastName = info.family_name ?? "";
  const normalized = email.toLowerCase();

  // Try to create a Shopify customer. If email is already taken that's fine —
  // we trust the verified Google token and issue a session regardless.
  let shopifyId: string | null = null;
  let shopifyAccessToken: string | null = null;
  try {
    const randomPassword = crypto.randomBytes(24).toString("base64");
    const customer = await registerCustomer({
      email: normalized,
      password: randomPassword,
      firstName,
      lastName,
    });
    shopifyId = customer.id;
    try {
      await tagCustomer(customer.id, ["website-signup"]);
    } catch (err) {
      console.error("Failed to tag Google customer as website-signup", err);
    }
    // Get Shopify access token for the new customer
    try {
      const { token: st } = await loginCustomer(normalized, randomPassword);
      shopifyAccessToken = st.accessToken;
    } catch {
      // non-fatal
    }
  } catch {
    // Customer already exists — Google token is verified, proceed without Shopify ID
  }

  const token = await signToken({
    sub: shopifyId ?? `google:${normalized}`,
    email: normalized,
    firstName,
    lastName,
    ...(shopifyAccessToken ? { shopifyToken: shopifyAccessToken } : {}),
  });

  const response = NextResponse.json({
    id: shopifyId ?? normalized,
    email: normalized,
    firstName,
  });
  response.cookies.set("session", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
