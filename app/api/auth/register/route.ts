import { NextResponse } from "next/server";
import { registerCustomer, loginCustomer } from "@/lib/shopify-storefront-auth";
import { tagCustomer } from "@/lib/shopify-admin";
import { signToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { email, password, firstName, lastName } = await request.json();

  if (!email || !password || !firstName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  try {
    const customer = await registerCustomer({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
    });

    // Tag as a website account so it's distinguishable from guest-checkout
    // customers in the Shopify admin (regardless of order count).
    try {
      await tagCustomer(customer.id, ["website-signup"]);
    } catch (err) {
      console.error("Failed to tag customer as website-signup", err);
    }

    let shopifyAccessToken: string | null = null;
    try {
      const { token: st } = await loginCustomer(email.toLowerCase(), password);
      shopifyAccessToken = st.accessToken;
    } catch {
      // non-fatal — cart will fall back to email-only buyer identity
    }

    const token = await signToken({
      sub: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      ...(shopifyAccessToken ? { shopifyToken: shopifyAccessToken } : {}),
    });

    const response = NextResponse.json(
      { id: customer.id, email: customer.email, firstName: customer.firstName },
      { status: 201 }
    );
    response.cookies.set("session", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (err: any) {
    const msg: string = err?.message ?? "Registration failed";
    if (msg.toLowerCase().includes("sent an email") || msg.toLowerCase().includes("verify your email")) {
      return NextResponse.json({ emailSent: true }, { status: 200 });
    }
    if (msg.toLowerCase().includes("taken")) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in instead." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
