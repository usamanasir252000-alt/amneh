import { FaWhatsapp } from "react-icons/fa";

const whatsappPhone = "923068639708";
const whatsappLink = `https://wa.me/${whatsappPhone}`;

export default function WhatsAppButton() {
  return (
    <div className="fixed right-2 bottom-3 z-50">
      <a
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/20 transition duration-200 hover:bg-green-700 hover:shadow-green-700/30 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-white"
      >
        <FaWhatsapp className="h-7 w-7 transition duration-200 group-hover:scale-110" />
      </a>
    </div>
  );
}
