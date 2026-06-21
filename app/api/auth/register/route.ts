import { NextResponse } from "next/server";
import {
  createCustomer,
  sendCustomerInvite,
  getCustomerByEmail,
} from "@/lib/shopify-admin";

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

  const normalized = email.toLowerCase();

  try {
    // Reject duplicates up-front so we show a clear message.
    const existing = await getCustomerByEmail(normalized);
    if (existing) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please log in instead.",
        },
        { status: 409 }
      );
    }

    // Create the customer WITHOUT a password → account is unactivated. This is
    // what forces email verification: the user can't log in until they click
    // the activation link, where their password (kept in localStorage) is set.
    const customer = await createCustomer({
      email: normalized,
      firstName,
      lastName,
      tags: ["website-signup"],
    });

    // Send Shopify's account-invite/activation email.
    await sendCustomerInvite(customer.id);

    return NextResponse.json({ emailSent: true }, { status: 200 });
  } catch (err: any) {
    const msg: string = err?.message ?? "Registration failed";
    if (msg.toLowerCase().includes("taken")) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please log in instead.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
