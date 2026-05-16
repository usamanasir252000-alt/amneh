import Image from "next/image";

const feedImages = [
  { src: "/r3.jpg", alt: "amneh look 1" },
  { src: "/r4.jpg", alt: "amneh look 2" },
  { src: "/r5.jpg", alt: "amneh look 3" },
  { src: "/r6.png", alt: "amneh look 4" },
];

export default function SocialFeed() {
  return (
    <section className="bg-white pb-10">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {feedImages.map((img, i) => (
          <div key={i} className="relative aspect-square overflow-hidden group cursor-pointer">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover object-center transition duration-500 group-hover:scale-105"
              sizes="25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-500" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-400 text-gray-600 hover:border-gray-700 hover:text-gray-800 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </section>
  );
}
