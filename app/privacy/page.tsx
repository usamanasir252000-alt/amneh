import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";

export const metadata = {
  title: "Privacy Policy — amneh.",
  description: "How amneh. collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f1efef] pt-28 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-6">
            <BackButton />
          </div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-3">
            legal
          </p>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-[12px] text-gray-400 mb-10">
            Last updated: June 2026
          </p>

          <div className="space-y-8 text-[14px] leading-7 text-gray-600">
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Who We Are
              </h2>
              <p>
                amneh. is a beauty brand based in Pakistan. We operate the
                website at{" "}
                <a
                  href="https://amneh.pk"
                  className="underline underline-offset-2 text-gray-800"
                >
                  amneh.pk
                </a>
                . This policy explains how we collect, use, and protect your
                personal information when you shop with us.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Information We Collect
              </h2>
              <ul className="space-y-2 list-none">
                {[
                  "Name, email address, and password when you create an account.",
                  "Shipping address and phone number when you place an order.",
                  "Payment information — processed securely by our payment provider; we do not store card details.",
                  "Order history and preferences.",
                  "Device and browsing data (via cookies) to improve site performance.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                How We Use Your Information
              </h2>
              <ul className="space-y-2 list-none">
                {[
                  "To process and fulfil your orders.",
                  "To send order confirmations and shipping updates via WhatsApp or email.",
                  "To manage your account and provide customer support.",
                  "To send marketing communications — only if you have opted in.",
                  "To improve our website and product offerings.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Sharing Your Information
              </h2>
              <p>
                We do not sell or rent your personal data. We share information
                only with trusted service providers necessary to operate our
                business — including Shopify (e-commerce platform), Twilio
                (WhatsApp notifications), and delivery partners — all of whom
                are contractually bound to keep your data secure.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Cookies
              </h2>
              <p>
                We use cookies to keep you signed in, remember your cart, and
                understand how visitors use our site. You can disable cookies
                in your browser settings, though some features may not function
                correctly.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Your Rights
              </h2>
              <p>
                You have the right to access, correct, or delete the personal
                data we hold about you at any time. To make a request, contact
                us at{" "}
                <a
                  href="mailto:amnehofficial@gmail.com"
                  className="underline underline-offset-2 text-gray-800"
                >
                  amnehofficial@gmail.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Data Security
              </h2>
              <p>
                We implement industry-standard security measures to protect
                your data. All data is transmitted over HTTPS and stored on
                secure servers. However, no method of transmission over the
                internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Contact
              </h2>
              <p>
                For any privacy-related questions, email us at{" "}
                <a
                  href="mailto:amnehofficial@gmail.com"
                  className="underline underline-offset-2 text-gray-800"
                >
                  amnehofficial@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
