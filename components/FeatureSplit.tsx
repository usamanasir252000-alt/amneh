import Image from "next/image";

export default function FeatureSplit() {
  return (
    <section
      id="collections"
      className="grid w-full gap-6 px-4  md:grid-cols-2 md:px-6"
      style={{ minHeight: "clamp(420px, 60vh, 680px)" }}
    >
      {/* Left card */}
      <div className="relative flex-1 min-h-[340px] overflow-hidden rounded-[2rem] border border-white/10 bg-transparent shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm transition duration-500 hover:-translate-y-1">
        <Image
          src="/background1.jpeg"
          alt="Hydrating collection"
          fill
          className="object-cover object-center transition duration-700 group-hover:scale-105"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight leading-snug mb-4">
            Hydrating,
            <br />
            Glow-Rich
            <br />
            Collection
          </h2>
          <a
            href="#products"
            className="inline-flex items-center justify-center border border-white bg-white px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-gray-900 hover:bg-transparent hover:text-white transition duration-300"
          >
            shop now
          </a>
        </div>
      </div>

      {/* Right card */}
      <div className="relative flex-1 min-h-[340px] overflow-hidden rounded-[2rem] border border-white/10 bg-transparent shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm transition duration-500 hover:-translate-y-1">
        <Image
          src="/r7.jpg"
          alt="Luminous skin care"
          fill
          className="object-cover object-center transition duration-700 group-hover:scale-105"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight leading-snug mb-4">
            Luminous,
            <br />
            Nourishing
            <br />
            Skin Care
          </h2>
          <a
            href="#products"
            className="inline-flex items-center justify-center border border-white bg-white px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-gray-900 hover:bg-transparent hover:text-white transition duration-300"
          >
            shop now
          </a>
        </div>
      </div>
    </section>
  );
}
