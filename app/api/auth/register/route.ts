import { NextResponse } from "next/server";
import * as shopifyAdmin from "@/lib/shopify-admin";
import { signToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { email, password, firstName, lastName } = await request.json();

  if (!email || !password || !firstName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const normalized = email.toLowerCase();
  const existing = await shopifyAdmin.getCustomerByEmail(normalized);
  if (existing)
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 },
    );

  // Create customer in Shopify
  const created = await shopifyAdmin.createCustomer({
    email: normalized,
    firstName,
    lastName,
  });

  // Store password hash in Shopify customer metafield (server-only access)
  const hash = await bcrypt.hash(password, 10);
  try {
    await shopifyAdmin.setCustomerPasswordHash(created.id, hash);
  } catch (err) {
    console.error("Failed to set password hash on Shopify customer", {
      email: normalized,
      err,
    });
  }

  // Issue JWT session containing Shopify customer id
  const token = await signToken({
    sub: created.id,
    email: normalized,
    firstName,
    lastName,
  });

  const response = NextResponse.json(
    { id: created.id, email: normalized, firstName, lastName },
    { status: 201 },
  );
  response.cookies.set("session", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
