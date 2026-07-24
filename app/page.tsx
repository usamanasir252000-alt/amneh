import { getProducts } from "@/lib/shopify";
import HomeClient from "./HomeClient";

// SERVER component. Fetching products here (not in a client useEffect) bakes the
// product carousel into the initial HTML — so visitors from Facebook/Instagram
// in-app browsers, which routinely stall or never run JavaScript, still see real
// products on first paint instead of a blank/loading page. .catch keeps the page
// rendering even if Shopify is briefly unreachable (the client carousel then
// falls back to its own retry fetch).
// ISR (not force-dynamic): the page is served from cache instantly and
// refreshed in the background at most every 2 minutes — navigating back home
// from a product no longer re-renders and re-fetches the whole catalog live.
export const revalidate = 120;

export default async function Home() {
  const products = await getProducts().catch(() => []);
  return <HomeClient initialProducts={products} />;
}
