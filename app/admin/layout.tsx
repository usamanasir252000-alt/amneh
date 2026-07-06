import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <img src="/logo.svg" alt="amneh." width={81} height={28} className="h-7 w-auto" />
          <span className="text-xs text-gray-300">|</span>
          <nav className="flex gap-5">
            <Link
              href="/admin/products"
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Products
            </Link>
            <Link
              href="/admin/products/new"
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              + New Product
            </Link>
            <Link
              href="/admin/reviews"
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Reviews
            </Link>
          </nav>
        </div>
        <LogoutButton />
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
