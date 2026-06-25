import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";

export const metadata = {
  title: "Shipping Policy — amneh.",
  description: "amneh. shipping rates, delivery times, and order tracking.",
};

export default function ShippingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f1efef] pt-28 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-6">
            <BackButton />
          </div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-3">
            policies
          </p>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-10">
            Shipping Policy
          </h1>

          <div className="space-y-8 text-[14px] leading-7 text-gray-600">
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Delivery Areas
              </h2>
              <p>
                We currently ship across Pakistan. International shipping is
                not available at this time but is coming soon.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Delivery Times
              </h2>
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-gray-100/70">
                      <th className="text-left px-4 py-3 text-gray-700 font-semibold">Location</th>
                      <th className="text-left px-4 py-3 text-gray-700 font-semibold">Estimated Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Karachi, Lahore, Islamabad", "2–3 business days"],
                      ["Other major cities", "3–5 business days"],
                      ["Remote areas", "5–7 business days"],
                    ].map(([loc, time]) => (
                      <tr key={loc} className="border-t border-gray-200">
                        <td className="px-4 py-3 text-gray-600">{loc}</td>
                        <td className="px-4 py-3 text-gray-600">{time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[13px] text-gray-500">
                Delivery times are estimates and may vary during peak seasons or
                due to courier delays.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Shipping Charges
              </h2>
              <ul className="space-y-2 list-none">
                {[
                  "Standard shipping: PKR 200 flat rate.",
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
                Cash on Delivery (COD)
              </h2>
              <p>
                We offer Cash on Delivery across Pakistan. Once your order is
                placed, you will receive a WhatsApp message to confirm your
                order before it is dispatched. Please confirm promptly to avoid
                delays.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Order Processing
              </h2>
              <p>
                Orders are processed within <strong>1–2 business days</strong>{" "}
                of confirmation. Orders placed on weekends or public holidays
                will be processed on the next business day.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Order Tracking
              </h2>
              <p>
                Once your order is dispatched, you will receive a tracking
                number via WhatsApp or email. You can use this to track your
                parcel with the respective courier.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Failed Deliveries
              </h2>
              <p>
                If a delivery attempt fails due to an incorrect address or the
                recipient being unavailable, the courier will make a second
                attempt. After two failed attempts, the order will be returned
                to us and a re-delivery fee may apply.
              </p>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.25em] text-gray-900 mb-3 font-semibold">
                Questions?
              </h2>
              <p>
                Contact us at{" "}
                <a
                  href="mailto:amnehofficial@gmail.com"
                  className="underline underline-offset-2 text-gray-800"
                >
                  amnehofficial@gmail.com
                </a>{" "}
                or WhatsApp{" "}
                <a
                  href="https://wa.me/923068639708"
                  className="underline underline-offset-2 text-gray-800"
                >
                  +92 306 8639708
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
