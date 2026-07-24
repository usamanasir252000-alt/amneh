import { NextResponse } from "next/server";

const JUDGEME_PUBLIC_TOKEN = process.env.JUDGEME_PUBLIC_TOKEN!;
const JUDGEME_PRIVATE_TOKEN = process.env.JUDGEME_PRIVATE_TOKEN!;
const JUDGEME_SHOP_DOMAIN = process.env.JUDGEME_SHOP_DOMAIN!;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productHandle = searchParams.get("productHandle");

    // Judge.me accepts product_external_id (the product handle) to filter by product.
    // Omit it for store-level reviews, include it for product-specific reviews.
    const params = new URLSearchParams({
      api_token: JUDGEME_PRIVATE_TOKEN,
      shop_domain: JUDGEME_SHOP_DOMAIN,
      per_page: "50",
      published: "true",
    });
    if (productHandle) params.append("product_external_id", productHandle);

    const url = `https://judge.me/api/v1/reviews?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Judge.me error: ${res.status}`);
    }

    const data = await res.json();

    const reviews = (data.reviews ?? []).map(
      (r: {
        id: number;
        reviewer: { name: string };
        rating: number;
        body: string;
        created_at: string;
      }) => ({
        id: r.id,
        name: r.reviewer.name,
        rating: r.rating,
        text: r.body,
        createdAt: r.created_at,
      })
    );

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews from Judge.me:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, rating, text, productHandle } = await request.json();

    if (!name || !email || !rating || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const body: Record<string, unknown> = {
      api_token: JUDGEME_PUBLIC_TOKEN,
      shop_domain: JUDGEME_SHOP_DOMAIN,
      platform: "shopify",
      name,
      email,
      rating,
      body: text,
    };
    // If a product handle is provided, link the review to that product in Judge.me.
    if (productHandle) body.product_external_id = productHandle;

    const res = await fetch("https://judge.me/api/v1/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error || data?.message || "Failed to submit review";
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    return NextResponse.json({ id: data.review?.id ?? Date.now() }, { status: 201 });
  } catch (error) {
    console.error("Error submitting review to Judge.me:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
