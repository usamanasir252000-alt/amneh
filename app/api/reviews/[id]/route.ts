import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { selected } = await request.json();

    if (typeof selected !== "boolean") {
      return NextResponse.json(
        { error: "Selected must be a boolean" },
        { status: 400 },
      );
    }

    const review = await prisma.review.update({
      where: { id: params.id },
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
