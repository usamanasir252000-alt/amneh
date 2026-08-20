import { utilityPageMetadata } from "@/lib/seo";

// Server layout wrapping a "use client" page — see app/discover/layout.tsx.
// noindex: this route has no search value (it is a one-time token landing page),
// and keeping it out of the index stops it competing with the pages that sell.
export const metadata = utilityPageMetadata("Activate Account", "/activate");

export default function ActivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
