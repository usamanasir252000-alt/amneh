import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = (await cookies()).get("user-session")?.value;
  if (!userId) return NextResponse.json(null);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json(null);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    loyaltyPoints: user.loyaltyPoints,
  });
}
