import { utilityPageMetadata } from "@/lib/seo";

// Server layout wrapping a "use client" page — see app/discover/layout.tsx.
// noindex: this route has no search value (the content is private and per-user),
// and keeping it out of the index stops it competing with the pages that sell.
export const metadata = utilityPageMetadata("Your Account", "/profile");

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
