import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return NextResponse.json(null);

  try {
    const payload = await verifyToken(token);
    return NextResponse.json({
      id: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      loyaltyPoints:
        typeof payload.loyaltyPoints === "number" ? payload.loyaltyPoints : 0,
    });
  } catch (err) {
    return NextResponse.json(null);
  }
}
