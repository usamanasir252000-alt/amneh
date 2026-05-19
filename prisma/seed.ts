import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();

  // General / homepage products
  const general = [
    {
      name: "blush glow",
      type: "hydrating serum",
      price: 38,
      shades: "+3 shades",
      badge: "new",
      category: "all",
      images: ["/shot1.png"],
    },
    {
      name: "petal tint",
      type: "velvet lip butter",
      price: 28,
      shades: "+5 shades",
      badge: "new",
      category: "all",
      images: ["/shot2.png"],
    },
    {
      name: "rose bloom",
      type: "radiance oil",
      price: 42,
      shades: "+2 shades",
      badge: "best seller",
      category: "all",
      images: ["/shot3.png"],
    },
  ];

  // Skincare products
  const skincare = [
    {
      name: "intensive hydration serum",
      type: "serum",
      price: 38,
      shades: "+1 shade",
      badge: "best seller",
      tagline: "24-hour moisture",
      description:
        "A powerhouse formula with hyaluronic acid and ceramides that delivers intense, long-lasting hydration and restores the skin barrier.",
      category: "skincare",
      images: ["/shot1.png"],
    },
    {
      name: "glycolic night serum",
      type: "serum",
      price: 42,
      shades: "+1 shade",
      badge: "new",
      tagline: "resurface + renew",
      description:
        "An overnight resurfacing serum with glycolic acid and niacinamide that smooths texture, minimises pores and evens skin tone.",
      category: "skincare",
      images: ["/shot2.png"],
    },
    {
      name: "glutathione brightening serum",
      type: "serum",
      price: 45,
      shades: "+1 shade",
      badge: "new",
      tagline: "illuminate + even",
      description:
        "A brightening serum packed with glutathione and vitamin C that targets dark spots and delivers a luminous, glass-skin glow.",
      category: "skincare",
      images: ["/shot3.png"],
    },
  ];

  for (const p of [...general, ...skincare]) {
    const { images, ...data } = p;
    await prisma.product.create({
      data: {
        ...data,
        images: {
          create: images.map((url, i) => ({ url, sortOrder: i })),
        },
      },
    });
  }

  console.log("Seeded 6 products.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
