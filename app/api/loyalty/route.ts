import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { getCustomerByEmail, getCustomerLoyalty } from "@/lib/shopify-admin";
import { REWARDS } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

function noStore(body: unknown) {
  const res = NextResponse.json(body);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return noStore(null);

  try {
    const payload = await verifyToken(token);
    const email = (payload.email as string | undefined)?.toLowerCase();
    if (!email) return noStore(null);

    const customer = await getCustomerByEmail(email);
    if (!customer) return noStore({ points: 0, rewards: [] });

    const loyalty = await getCustomerLoyalty(customer.id);

    return noStore({
      points: loyalty.points,
      rewards: REWARDS.map((r) => {
        const codeEntry = loyalty.rewardCodes.find(
          (c) => c.threshold === r.points,
        );
        return {
          points: r.points,
          discountPct: r.discountPct,
          label: r.label,
          unlocked: loyalty.points >= r.points,
          code: codeEntry?.code ?? null,
          expiresAt: codeEntry?.expiresAt ?? null,
        };
      }),
    });
  } catch {
    return noStore(null);
  }
}
