import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const products = await prisma.product.findMany({
    where: category ? { category } : undefined,
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, type, price, shades, badge, tagline, description, category } = body;

  const product = await prisma.product.create({
    data: { name, type, price: Number(price), shades, badge, tagline, description, category },
    include: { images: true },
  });

  return NextResponse.json(product, { status: 201 });
}
