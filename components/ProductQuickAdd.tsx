"use client";

import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

interface ProductQuickAddProps {
  id: string;
  name: string;
  price: number;
  image: string;
  variant?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function ProductQuickAdd({
  id,
  name,
  price,
  image,
  variant,
  className = "",
  children,
}: ProductQuickAddProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      image,
      variant,
    });

    // Show confirmation
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.button
      onClick={handleAddToCart}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${className} transition-all duration-300 relative overflow-hidden`}
    >
      {children}
      <motion.div
        initial={false}
        animate={{ opacity: isAdded ? 1 : 0, y: isAdded ? 0 : 10 }}
        className="absolute inset-0 bg-rose-400 text-white flex items-center justify-center text-sm font-medium pointer-events-none"
      >
        ✓ Added
      </motion.div>
    </motion.button>
  );
}
