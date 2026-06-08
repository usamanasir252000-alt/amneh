import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { selected } = await request.json();

    if (typeof selected !== "boolean") {
      return NextResponse.json(
        { error: "Selected must be a boolean" },
        { status: 400 },
      );
    }

    const review = await prisma.review.update({
      where: { id },
      data: { selected },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error updating review selection:", error);
    return NextResponse.json(
      { error: "Failed to update review selection" },
      { status: 500 },
    );
  }
}
