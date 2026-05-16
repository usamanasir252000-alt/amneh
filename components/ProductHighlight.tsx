import Image from "next/image";

export default function ProductHighlight() {
  return (
    <section id="skincare" className="bg-white">
      <div className="flex flex-col lg:flex-row">
        {/* Left image */}
        <div className="relative hidden lg:block lg:flex-1 min-h-[520px]">
          <Image
            src="/product3.jpeg"
            alt="amneh product"
            fill
            className="object-cover object-center"
            sizes="33vw"
          />
        </div>

        {/* Center text */}
        <div className="flex flex-1 flex-col items-center justify-center px-10 py-20 text-center lg:max-w-sm lg:flex-none lg:px-16">
          <h2 className="text-3xl font-bold uppercase tracking-tight" style={{ color: "#7d4f5a" }}>
            Hydrate, Glow, Go
          </h2>
          <p className="mt-4 text-sm text-gray-600 leading-7">
            discover two essential formulas for radiant skin all day long:
          </p>
          <ul className="mt-6 space-y-4 text-sm text-gray-700 text-left">
            <li>
              💧 <strong>hydrating serum</strong> delivers lasting comfort and up to 24-hour moisture
            </li>
            <li>
              ☁️ <strong>velvet balm</strong> offers instant hydration and doubles as a daily lip mask
            </li>
          </ul>
          <a
            href="#"
            className="mt-9 inline-flex items-center justify-center border border-gray-900 px-9 py-3 text-xs uppercase tracking-[0.22em] text-gray-900 hover:bg-gray-900 hover:text-white transition duration-300"
          >
            shop now
          </a>
        </div>

        {/* Right image */}
        <div className="relative hidden lg:block lg:flex-1 min-h-[520px]">
          <Image
            src="/r5.jpg"
            alt="amneh product"
            fill
            className="object-cover object-center"
            sizes="33vw"
          />
        </div>
      </div>
    </section>
  );
}
