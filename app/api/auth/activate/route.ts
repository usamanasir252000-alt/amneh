import { NextResponse } from "next/server";
import { activateCustomerByUrl } from "@/lib/shopify-storefront-auth";

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
    // Activates (verifies) the account. We don't issue a session here — the
    // user is sent to the login page to sign in with their password.
    const { customer } = await activateCustomerByUrl(activationUrl, password);

    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
    });
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
