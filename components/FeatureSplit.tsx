export default function FeatureSplit() {
  return (
    <section id="collections" className="relative w-full md:py-20 md:px-6 flex justify-center overflow-hidden">
      {/* Background video — dull/dark, desktop only */}
      <video
        src="/video2.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center scale-105 hidden md:block"
      />
      <div className="absolute inset-0 bg-black/30 hidden md:block" />

      {/* Foreground card */}
      <div className="relative z-10 w-full md:max-w-4xl h-[520px] sm:h-[620px] md:h-[700px] overflow-hidden md:rounded-sm shadow-2xl">
        <video
          src="/video2.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight leading-snug mb-4">
            Luminous,<br />Nourishing<br />Skin Care
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
