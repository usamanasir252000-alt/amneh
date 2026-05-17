import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { url, sortOrder } = body;

  const image = await prisma.productImage.create({
    data: {
      url,
      sortOrder: sortOrder ?? 0,
      productId: id,
    },
  });

  return NextResponse.json(image, { status: 201 });
}
