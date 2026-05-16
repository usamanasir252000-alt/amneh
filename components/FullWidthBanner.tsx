import Image from "next/image";

export default function FullWidthBanner() {
  return (
    <section className="relative min-h-[500px] w-full overflow-hidden" style={{ height: "clamp(420px, 60vh, 680px)" }}>
      <Image
        src="/background1.jpeg"
        alt="The essentials collection"
        fill
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />
      <div className="relative z-10 flex h-full items-center px-12 lg:px-20">
        <div className="max-w-xs">
          <h2
            className="text-3xl sm:text-4xl font-bold uppercase tracking-tight leading-snug"
            style={{ color: "#d4a8b4" }}
          >
            The<br />Essentials
          </h2>
          <p className="mt-4 text-sm text-white/80 leading-7">
            warm, fresh, and radiant — discover our best-selling beauty essentials.
          </p>
          <a
            href="#"
            className="mt-6 inline-flex items-center justify-center border border-white bg-white px-8 py-3 text-xs uppercase tracking-[0.22em] text-gray-900 hover:bg-transparent hover:text-white transition duration-300"
          >
            shop now
          </a>
        </div>
      </div>
    </section>
  );
}
