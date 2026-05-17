import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductEditForm from "@/components/admin/ProductEditForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Edit Product</h1>
      <ProductEditForm product={product} />
    </div>
  );
}
