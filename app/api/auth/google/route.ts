import { NextResponse } from "next/server";
import * as shopifyAdmin from "@/lib/shopify-admin";
import { signToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

// Client should POST { id_token }
export async function POST(request: Request) {
  const { id_token } = await request.json();
  if (!id_token)
    return NextResponse.json({ error: "Missing id_token" }, { status: 400 });

  // Verify token with Google tokeninfo endpoint
  const verify = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`,
  );
  if (!verify.ok)
    return NextResponse.json(
      { error: "Invalid Google token" },
      { status: 401 },
    );
  const info = await verify.json();
  const email = info.email as string | undefined;
  const email_verified =
    info.email_verified === "true" || info.email_verified === true;
  if (!email || !email_verified)
    return NextResponse.json(
      { error: "Google email not verified" },
      { status: 401 },
    );

  const firstName = info.given_name ?? info.name?.split(" ")[0] ?? "";
  const lastName =
    info.family_name ?? info.name?.split(" ").slice(1).join(" ") ?? "";

  // Ensure customer exists in Shopify
  try {
    console.log(
      "Google auth successful, syncing with Shopify",
      { email },
      { firstName, lastName },
    );
    const customer = await shopifyAdmin.ensureCustomerForGoogle({
      email: email.toLowerCase(),
      firstName,
      lastName,
    });
    if (!customer) throw new Error("Failed to create or find Shopify customer");

    const token = await signToken({
      sub: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
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
  } catch (err) {
    console.error("Google auth Shopify sync failed", { email, err });
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
