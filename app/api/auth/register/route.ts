import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/shopify-storefront-auth";
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

    const token = await signToken({
      sub: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
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
    const status = msg.toLowerCase().includes("taken") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
