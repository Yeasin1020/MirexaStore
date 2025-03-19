import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { MdLocalPhone } from "react-icons/md";

const FloatingIcons: React.FC = () => {
  return (
    <div className="fixed bottom-5 right-5 flex flex-col items-center space-y-2 md:space-y-3 lg:space-y-4 z-50">
      {/* WhatsApp Icon */}
      <a
        href="https://wa.me/+8801831283283" // Replace with your actual phone number
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 text-white p-2 rounded-full shadow-lg hover:scale-110 hover:bg-green-600 transition-all duration-500 text-2xl md:text-3xl lg:text-4xl animate-bounce"
        aria-label="Chat with us on WhatsApp"
      >
        <FaWhatsapp />
      </a>

      {/* Phone Call Icon */}
      <a
        href="tel:+8801405671742" // Replace with your actual phone number
        className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:scale-110 hover:bg-blue-600 transition-all duration-500 text-2xl md:text-3xl lg:text-4xl animate-bounce delay-200"
        aria-label="Call us"
      >
        <MdLocalPhone />
      </a>
    </div>
  );
};

export default FloatingIcons;
