import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f1efef]">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-400 text-sm">Product not found.</p>
        <Link href="/" className="text-xs uppercase tracking-widest border border-gray-900 px-6 py-2.5 hover:bg-gray-900 hover:text-white transition">Back to Home</Link>
      </div>
    </main>
  );
}
