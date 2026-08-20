import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import {
  graph,
  webPageNode,
  breadcrumbNode,
} from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The terms and conditions for using the Amneh website and placing an order.",
  path: "/terms",
});

export default function TermsPage() {
  const data = graph([
    webPageNode({
      path: "/terms",
      name: "Terms of Service",
      description:
        "The terms and conditions for using the Amneh website and placing an order.",
    }),
    breadcrumbNode([{ name: "Terms of Service", path: "/terms" }], `${SITE_URL}/terms`),
  ]);

  return (
    <>
      <JsonLd data={data} />
      <Navbar />
      <main className="min-h-screen bg-[#f1efef] pt-[148px] pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-6">
            <BackButton />
          </div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-3">
            legal
          </p>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-[12px] text-gray-400 mb-10">
            Last updated: June 2026
          </p>

          <div className="space-y-8 text-[14px] leading-7 text-gray-600">
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Acceptance of Terms
              </h2>
              <p>
                By accessing or using the amneh. website, you agree to be bound
                by these Terms of Service. If you do not agree, please do not
                use our website or services.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Products &amp; Descriptions
              </h2>
              <p>
                We make every effort to display our products as accurately as
                possible. Colours may vary slightly due to monitor settings.
                We reserve the right to limit quantities, discontinue products,
                or modify prices at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Orders &amp; Payment
              </h2>
              <ul className="space-y-2 list-none">
                {[
                  "All prices are listed in Pakistani Rupees (PKR) and include applicable taxes.",
                  "We accept Cash on Delivery (COD) and online payment methods as available at checkout.",
                  "Placing an order constitutes an offer to purchase. We reserve the right to refuse or cancel any order.",
                  "For COD orders, you will receive a WhatsApp confirmation request before your order is dispatched.",
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
                Intellectual Property
              </h2>
              <p>
                All content on this website — including images, text, logos,
                and product designs — is the property of amneh. and may not be
                copied, reproduced, or distributed without written permission.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                User Accounts
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your
                account credentials. You agree to notify us immediately of any
                unauthorised use of your account. We reserve the right to
                terminate accounts that violate these terms.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Limitation of Liability
              </h2>
              <p>
                amneh. shall not be liable for any indirect, incidental, or
                consequential damages arising from the use of our products or
                website. Our total liability shall not exceed the amount paid
                for the specific order in question.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Governing Law
              </h2>
              <p>
                These terms are governed by the laws of Pakistan. Any disputes
                shall be subject to the exclusive jurisdiction of the courts of
                Pakistan.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Changes to Terms
              </h2>
              <p>
                We may update these terms at any time. Continued use of the
                website after changes constitutes acceptance of the revised
                terms.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Contact
              </h2>
              <p>
                Questions about these terms? Email us at{" "}
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
