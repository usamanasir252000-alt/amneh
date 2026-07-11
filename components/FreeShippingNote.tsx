// Bold, can't-miss free-shipping reminder — reused wherever a shopper is
// close to deciding to buy (right below the buy buttons on the product page,
// near the top of the /skincare grid) so the shipping cost isn't a surprise
// they only discover at checkout. Static threshold text, not tied to the
// current cart/quantity, since it needs to make sense standalone on a
// listing page too.
export default function FreeShippingNote({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#5f3d4e] to-[#4d9ab5] px-4 py-2.5 text-white shadow-sm ${className}`}
    >
      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
      <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-center">
        Free shipping on orders PKR 3,000+
      </p>
    </div>
  );
}
