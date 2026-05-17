import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { imageId } = await params;
  const body = await request.json();
  const image = await prisma.productImage.update({
    where: { id: imageId },
    data: {
      ...(body.url !== undefined && { url: body.url }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });
  return NextResponse.json(image);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { imageId } = await params;
  await prisma.productImage.delete({ where: { id: imageId } });
  return NextResponse.json({ success: true });
}
