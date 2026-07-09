import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";

export const metadata = {
  title: "Returns & Refunds — amneh.",
  description: "amneh. returns, no-refund policy, and goodwill compensation for genuine cases.",
};

export default function ReturnsPage() {
  return (
    <>
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
                We want you to love your amneh. products. Because our products
                are personal-care and skincare items, <strong>all sales are
                final and we do not offer refunds</strong>. That said, if
                something is genuinely wrong with your order, we will always try
                to make it right — see <em>Genuine Issues</em> below.
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
                  href="https://wa.me/923068639708"
                  className="underline underline-offset-2 text-gray-800"
                >
                  +92 306 8639708
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
