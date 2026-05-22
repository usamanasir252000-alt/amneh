import Image from "next/image";

export default function FullWidthBanner() {
  return (
    <section className="relative w-full overflow-hidden" style={{ height: "clamp(460px, 65vh, 700px)" }}>
      <Image
        src="/background1.jpeg"
        alt="The essentials collection"
        fill
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      <div className="relative z-10 flex h-full items-end px-10 pb-14 lg:px-20 lg:pb-20">
        <div className="max-w-sm">
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/60 mb-4">bestsellers</p>
          <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-tight leading-none text-white mb-5">
            The<br />Essentials
          </h2>
          <p className="text-sm text-white/70 leading-7 mb-7 max-w-[220px]">
            Warm, fresh, and radiant — discover our best-selling beauty essentials.
          </p>
          <a
            href="#products"
            className="inline-flex items-center justify-center border border-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] text-white hover:bg-white hover:text-gray-900 transition duration-300"
          >
            shop now
          </a>
        </div>
      </div>
    </section>
  );
}
