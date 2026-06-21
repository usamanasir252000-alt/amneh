import { NextResponse } from "next/server";
import { loginCustomer } from "@/lib/shopify-storefront-auth";
import { signToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  try {
    const { token: shopifyToken, customer } = await loginCustomer(email.toLowerCase(), password);

    const token = await signToken({
      sub: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      shopifyToken: shopifyToken.accessToken,
    });

    const response = NextResponse.json({
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
    });
    response.cookies.set("session", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }
}
