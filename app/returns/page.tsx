import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { waChatLink, WHATSAPP_DISPLAY } from "@/lib/contact";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import {
  graph,
  webPageNode,
  breadcrumbNode,
  returnPolicyNode,
} from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";

export const metadata = pageMetadata({
  title: "Returns & Refunds",
  description:
    "Amneh returns, our no-refund policy, and the goodwill compensation we offer for genuine cases.",
  path: "/returns",
});

export default function ReturnsPage() {
  const data = graph([
    webPageNode({
      path: "/returns",
      name: "Returns & Refunds",
      description:
        "Amneh returns, our no-refund policy, and the goodwill compensation we offer for genuine cases.",
    }),
    returnPolicyNode(),
    breadcrumbNode([{ name: "Returns & Refunds", path: "/returns" }], `${SITE_URL}/returns`),
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
            policies
          </p>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-10">
            Returns &amp; Refunds
          </h1>

          <div className="space-y-8 text-[14px] leading-7 text-gray-600">
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Our Policy
              </h2>
              <p>
                <strong>If your product arrives damaged, broken, or incorrect,
                we will replace it free of charge</strong> — just send us a
                photo on WhatsApp within 7 days of delivery. Your money is
                never at risk on a damaged delivery.
              </p>
              <p className="mt-3">
                Because our products are personal-care and skincare items, we
                cannot accept returns or exchanges on products that arrive in
                good condition — <strong>all sales of undamaged items are
                final</strong>, for hygiene and safety reasons.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                No Refunds
              </h2>
              <p>
                We do not provide cash, card, or bank-transfer refunds on any
                order, including Cash on Delivery. We also do not accept change-
                of-mind returns. Please review your order carefully before
                confirming it.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Genuine Issues
              </h2>
              <p>
                If your case is genuine and verified, we will make it right —
                not with a refund, but with a <strong>replacement</strong> of
                the affected item or a <strong>goodwill discount toward a
                future order</strong>. The form of compensation is offered at
                amneh.&apos;s discretion after we review your case.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Eligibility for Compensation
              </h2>
              <ul className="space-y-2 list-none">
                {[
                  "Report the issue within 7 days of receiving your order.",
                  "Provide your order number and clear photos of the product and packaging.",
                  "The issue must be genuine and verifiable — e.g. damaged in transit, wrong item delivered, or a confirmed product defect.",
                  "Opened or used skincare products are not eligible except in the case of verified damage or defect, due to hygiene reasons.",
                  "Change-of-mind, 'no longer needed', or ordering the wrong item by mistake do not qualify.",
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
                How to Report an Issue
              </h2>
              <p>
                Contact us at{" "}
                <a
                  href="mailto:amnehofficial@gmail.com"
                  className="underline underline-offset-2 text-gray-800"
                >
                  amnehofficial@gmail.com
                </a>{" "}
                or via WhatsApp at{" "}
                <a
                  href={waChatLink()}
                  className="underline underline-offset-2 text-gray-800"
                >
                  {WHATSAPP_DISPLAY}
                </a>{" "}
                within 7 days of delivery. Include your order number, a
                description of the problem, and clear photos. We will review and
                respond within 1–2 business days.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Damaged or Incorrect Items
              </h2>
              <p>
                If you received a damaged or incorrect item, please contact us
                immediately with photos of the product and packaging. Once
                verified, we will arrange a replacement or offer a goodwill
                discount at no additional cost. We do not issue refunds for
                these cases.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
