import Image from "next/image";

export default function PromoSection() {
  return (
    <section className="bg-white">
      <div className="flex flex-col md:flex-row" style={{ minHeight: "500px" }}>
        {/* Left: image */}
        <div className="relative flex-1 min-h-[350px] md:min-h-0">
          <Image
            src="/r6.png"
            alt="Free beauty bag"
            fill
            className="object-cover object-center"
            sizes="50vw"
          />
        </div>

        {/* Right: text */}
        <div className="flex flex-1 flex-col items-center justify-center px-10 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-900 mb-4">
            Online Exclusive
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold uppercase leading-tight" style={{ color: "#2b6c8a" }}>
            Free<br />Beauty Bag
          </h2>
          <p className="mt-5 text-sm text-gray-600 leading-7 max-w-xs">
            get a limited-edition <strong>beauty bag</strong> — perfect for keeping your amneh. essentials organized.
          </p>
          <p className="mt-3 text-[11px] text-gray-400">
            free with any $55+ order. while supplies last. offer ends 5/31/26 @ 11:59 pm.
          </p>
          <a
            href="#products"
            className="mt-7 inline-flex items-center justify-center border border-gray-900 px-9 py-3 text-xs uppercase tracking-[0.22em] text-gray-900 hover:bg-gray-900 hover:text-white transition duration-300"
          >
            shop now
          </a>
        </div>
      </div>
    </section>
  );
}
