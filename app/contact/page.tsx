import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { waChatLink, WHATSAPP_DISPLAY } from "@/lib/contact";

export const metadata = {
  title: "Contact Us — amneh.",
  description: "Get in touch with the amneh. team.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f1efef] pt-[148px] pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-6">
            <BackButton />
          </div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-3">
            get in touch
          </p>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-[14px] text-gray-500 mb-12 max-w-sm leading-6">
            We're here to help. Reach out via any of the channels below and
            we'll get back to you as soon as possible.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* WhatsApp */}
            <a
              href={waChatLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 border border-gray-200 bg-white/60 p-6 hover:border-gray-400 transition duration-200"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-[11px] uppercase tracking-[0.2em] text-gray-900 font-semibold">
                  WhatsApp
                </span>
              </div>
              <p className="text-[13px] text-gray-600">{WHATSAPP_DISPLAY}</p>
              <p className="text-[12px] text-gray-400">
                Mon–Sat, 10am–8pm PKT
              </p>
            </a>

            {/* Email */}
            <a
              href="mailto:amnehofficial@gmail.com"
              className="group flex flex-col gap-3 border border-gray-200 bg-white/60 p-6 hover:border-gray-400 transition duration-200"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="text-[11px] uppercase tracking-[0.2em] text-gray-900 font-semibold">
                  Email
                </span>
              </div>
              <p className="text-[13px] text-gray-600">amnehofficial@gmail.com</p>
              <p className="text-[12px] text-gray-400">
                We reply within 24 hours
              </p>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/amnehofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 border border-gray-200 bg-white/60 p-6 hover:border-gray-400 transition duration-200"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span className="text-[11px] uppercase tracking-[0.2em] text-gray-900 font-semibold">
                  Instagram
                </span>
              </div>
              <p className="text-[13px] text-gray-600">@amnehofficial</p>
              <p className="text-[12px] text-gray-400">DMs open</p>
            </a>

            {/* Business Hours */}
            <div className="flex flex-col gap-3 border border-gray-200 bg-white/60 p-6">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[11px] uppercase tracking-[0.2em] text-gray-900 font-semibold">
                  Hours
                </span>
              </div>
              <p className="text-[13px] text-gray-600">Monday – Saturday</p>
              <p className="text-[13px] text-gray-600">10:00 AM – 8:00 PM PKT</p>
              <p className="text-[12px] text-gray-400">Closed on Sundays &amp; public holidays</p>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-[12px] text-gray-400 leading-6">
              For order-related queries, please have your order number ready.
              For returns or damaged items, attach a photo when contacting us —
              it helps us resolve your issue faster.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
