import { pageMetadata, SITE_URL } from "@/lib/seo";
import { graph, webPageNode, breadcrumbNode } from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";

// The page itself is a "use client" component, and a client component cannot
// export `metadata` — Next only reads that export from server files. Wrapping
// the route in this tiny server layout is how the page gets a real title,
// description and canonical without converting the whole page to a server
// component and splitting out its animations.
export const metadata = pageMetadata({
  title: "Ingredients We Use",
  description:
    "The actives behind Amneh — niacinamide, hyaluronic acid, pineapple ceramide, apple and strawberry extract — and what each one does for your skin.",
  path: "/discover",
});

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The JSON-LD is emitted from the layout for the same reason the metadata is:
  // the page is a client component, and structured data must be in the server-
  // rendered HTML to be seen by crawlers.
  const data = graph([
    webPageNode({
      path: "/discover",
      name: "Ingredients We Use",
      description:
        "The actives behind Amneh — niacinamide, hyaluronic acid, pineapple ceramide, apple and strawberry extract — and what each one does for your skin.",
    }),
    breadcrumbNode([{ name: "Ingredients We Use", path: "/discover" }], `${SITE_URL}/discover`),
  ]);

  return (
    <>
      <JsonLd data={data} />
      {children}
    </>
  );
}
