import { utilityPageMetadata } from "@/lib/seo";

// Server layout wrapping a "use client" page — see app/discover/layout.tsx.
// noindex: this route has no search value (it is an account form),
// and keeping it out of the index stops it competing with the pages that sell.
export const metadata = utilityPageMetadata("Sign In", "/login");

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
