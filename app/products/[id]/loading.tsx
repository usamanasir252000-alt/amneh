// Instant skeleton shown the moment a shopper clicks a product, in the rare
// case the page isn't already in the ISR cache (first hit after a deploy or
// revalidation of a brand-new product). Cached hits skip this entirely.
// Mirrors the PDP's rough shape: hero image, then title/price/CTA column.
export default function LoadingProduct() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="aspect-square w-full rounded-2xl bg-neutral-200 md:w-1/2" />
        <div className="flex w-full flex-col gap-4 md:w-1/2 md:pt-4">
          <div className="h-8 w-3/4 rounded bg-neutral-200" />
          <div className="h-5 w-1/3 rounded bg-neutral-200" />
          <div className="h-4 w-full rounded bg-neutral-100" />
          <div className="h-4 w-5/6 rounded bg-neutral-100" />
          <div className="h-4 w-2/3 rounded bg-neutral-100" />
          <div className="mt-4 h-12 w-full rounded-full bg-neutral-200" />
          <div className="h-12 w-full rounded-full bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
