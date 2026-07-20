import { getProducts } from "@/lib/shopify";
import SkincareClient from "./SkincareClient";

// SERVER component. Fetching the serum products here (not in a client useEffect)
// bakes the product grid into the initial HTML — so visitors from Facebook/
// Instagram in-app browsers, which routinely stall or never run JavaScript,
// see real products on first paint instead of a blank/loading page. .catch
// keeps the page rendering if Shopify is briefly unreachable (the client then
// falls back to its own retry fetch).
export const dynamic = "force-dynamic";

export default async function SkincarePage() {
  const products = await getProducts("serums").catch(() => []);
  return <SkincareClient initialProducts={products} />;
}
