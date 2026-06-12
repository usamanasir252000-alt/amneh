import { NextResponse } from "next/server";
import * as shopifyAdmin from "@/lib/shopify-admin";
import { signToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password)
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });

  const normalized = email.toLowerCase();
  const customer = await shopifyAdmin.verifyCustomerPasswordByEmail(
    normalized,
    password,
  );
  if (!customer)
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );

  // Issue JWT session containing Shopify customer id
  const token = await signToken({
    sub: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
  });

  const response = NextResponse.json(
    { id: customer.id, email: customer.email, firstName: customer.firstName },
    { status: 200 },
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
