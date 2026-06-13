import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Returns & Refunds — amneh.",
  description: "amneh. return and refund policy.",
};

export default function ReturnsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f1efef] pt-28 pb-20">
        <div className="max-w-2xl mx-auto px-6">
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
                We want you to love your amneh. products. If you are not
                completely satisfied, you may request a return or exchange
                within <strong>7 days</strong> of receiving your order.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Eligibility
              </h2>
              <ul className="space-y-2 list-none">
                {[
                  "Item must be unused, unopened, and in its original packaging.",
                  "Returns are not accepted on opened or used skincare products due to hygiene reasons.",
                  "Sale or discounted items are final sale and cannot be returned.",
                  "The original order confirmation must be provided.",
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
                How to Request a Return
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
                  href="https://wa.me/923334274492"
                  className="underline underline-offset-2 text-gray-800"
                >
                  +92 333 4274492
                </a>{" "}
                within 7 days of delivery. Include your order number and reason
                for return. We will provide return instructions within 1–2
                business days.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Refunds
              </h2>
              <p>
                Once your return is received and inspected, we will notify you
                of the approval or rejection of your refund. Approved refunds
                are processed within <strong>5–7 business days</strong> to your
                original payment method. For Cash on Delivery orders, refunds
                are issued via bank transfer.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Damaged or Incorrect Items
              </h2>
              <p>
                If you received a damaged or incorrect item, please contact us
                immediately with a photo of the product and packaging. We will
                arrange a replacement or full refund at no additional cost.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Return Shipping
              </h2>
              <p>
                Customers are responsible for return shipping costs unless the
                item is damaged or incorrect. We recommend using a trackable
                shipping method as we cannot be held responsible for lost
                return parcels.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
