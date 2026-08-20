import { pageMetadata, SITE_URL } from "@/lib/seo";
import { graph, webPageNode, breadcrumbNode } from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";

// Server layout wrapping a "use client" page — see the note in
// app/discover/layout.tsx for why the metadata lives here.
//
// Indexable on purpose: the signed-out view is a public explanation of the
// loyalty programme, which is genuine landing-page material. Only the
// per-account pages (/profile, /login, /signup, /activate) are noindex.
export const metadata = pageMetadata({
  title: "Rewards & Loyalty",
  description:
    "Earn points on every Amneh order and unlock member, silver and gold tier discounts. Join free and start with a welcome bonus.",
  path: "/rewards",
});

export default function RewardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The JSON-LD is emitted from the layout for the same reason the metadata is:
  // the page is a client component, and structured data must be in the server-
  // rendered HTML to be seen by crawlers.
  const data = graph([
    webPageNode({
      path: "/rewards",
      name: "Rewards & Loyalty",
      description:
        "Earn points on every Amneh order and unlock member, silver and gold tier discounts. Join free and start with a welcome bonus.",
    }),
    breadcrumbNode([{ name: "Rewards & Loyalty", path: "/rewards" }], `${SITE_URL}/rewards`),
  ]);

  return (
    <>
      <JsonLd data={data} />
      {children}
    </>
  );
}
