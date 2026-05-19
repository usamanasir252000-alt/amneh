import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const DAILY_LOGIN_POINTS = 25;

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  // Award daily login points (once per calendar day)
  const today = new Date().toISOString().slice(0, 10);
  let pointsAwarded = 0;
  if (user.lastLoginDate !== today) {
    pointsAwarded = DAILY_LOGIN_POINTS;
    await prisma.user.update({
      where: { id: user.id },
      data: { loyaltyPoints: { increment: DAILY_LOGIN_POINTS }, lastLoginDate: today },
    });
  }

  const updated = await prisma.user.findUnique({ where: { id: user.id } });

  const response = NextResponse.json({
    id: updated!.id,
    email: updated!.email,
    firstName: updated!.firstName,
    loyaltyPoints: updated!.loyaltyPoints,
    pointsAwarded,
  });

  response.cookies.set("user-session", user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });

  return response;
}
