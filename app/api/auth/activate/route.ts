import { NextResponse } from "next/server";
import { activateCustomerByUrl } from "@/lib/shopify-storefront-auth";
import { signToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { activationUrl, password } = await request.json();

  if (!activationUrl || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  try {
    // Activates the account AND logs the user in by issuing a session cookie,
    // so they land on the site already signed in.
    const { token: shopifyToken, customer } = await activateCustomerByUrl(
      activationUrl,
      password
    );

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
  } catch (err: any) {
    const msg: string = err?.message ?? "Activation failed";
    // Shopify returns this when the link is stale or already used
    const friendly =
      msg.toLowerCase().includes("expired") ||
      msg.toLowerCase().includes("invalid") ||
      msg.toLowerCase().includes("already")
        ? "This activation link is invalid or has already been used. Try logging in instead."
        : msg;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }
}
