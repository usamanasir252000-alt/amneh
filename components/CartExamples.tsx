"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

/**
 * Example Component: Different ways to integrate cart functionality
 * This file demonstrates all integration patterns for the shopping cart
 */

// Pattern 1: Simple button with useCart hook
export function SimpleAddButton() {
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem({
      id: "example-1",
      name: "Hydrating Serum",
      price: 38,
      image: "/product1.jpeg",
    });
  };

  return (
    <button
      onClick={handleAdd}
      className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
    >
      Add to Cart
    </button>
  );
}

// Pattern 2: Button with variant selection
export function VariantSelector() {
  const { addItem } = useCart();
  const [variant, setVariant] = useState("vanilla");

  const handleAdd = () => {
    addItem({
      id: "example-2",
      name: "Lip Butter",
      price: 28,
      image: "/r3.jpg",
      variant: variant,
    });
  };

  return (
    <div className="space-y-3">
      <select
        value={variant}
        onChange={(e) => setVariant(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
      >
        <option value="vanilla">Vanilla Caramel</option>
        <option value="rose">Rose Bloom</option>
        <option value="berry">Berry Bliss</option>
      </select>
      <button
        onClick={handleAdd}
        className="w-full px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
      >
        Add {variant} to Cart
      </button>
    </div>
  );
}

// Pattern 3: Product grid with quick add
export function ProductGridExample() {
  const products = [
    {
      id: "grid-1",
      name: "Blush Glow",
      price: 38,
      image: "/product1.jpeg",
    },
    {
      id: "grid-2",
      name: "Petal Tint",
      price: 28,
      image: "/r3.jpg",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    addItem(product);
    setTimeout(() => setIsAdding(false), 1500);
  };

  return (
    <div className="border border-gray-200 rounded overflow-hidden">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="200px"
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-600 mt-1">${product.price}</p>
        <motion.button
          onClick={handleAdd}
          whileTap={{ scale: 0.95 }}
          className="mt-3 w-full py-2 bg-rose-400 text-white text-sm rounded hover:bg-rose-500 transition-colors relative overflow-hidden"
        >
          <motion.span
            initial={false}
            animate={{ opacity: isAdding ? 0 : 1, y: isAdding ? 10 : 0 }}
          >
            Add to Cart
          </motion.span>
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={{ opacity: isAdding ? 1 : 0, y: isAdding ? 0 : -10 }}
          >
            ✓ Added!
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
}

// Pattern 4: Access cart state and display info
export function CartStatus() {
  const { items, getTotalItems, getTotalPrice, openCart } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-blue-50 border border-blue-200 rounded"
    >
      <p className="text-sm text-gray-700">
        <strong>Cart Items:</strong> {getTotalItems()}
      </p>
      <p className="text-sm text-gray-700 mt-1">
        <strong>Total:</strong> ${getTotalPrice().toFixed(2)}
      </p>
      {getTotalItems() > 0 && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={openCart}
          className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
        >
          View Cart
        </motion.button>
      )}
    </motion.div>
  );
}

// Pattern 5: Quantity input before adding
export function QuantityInput() {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: "example-5",
        name: "Rose Bloom Oil",
        price: 42,
        image: "/r4.jpg",
      });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="h-8 w-8 border border-gray-300 rounded hover:bg-gray-50"
        >
          −
        </button>
        <span className="w-8 text-center">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="h-8 w-8 border border-gray-300 rounded hover:bg-gray-50"
        >
          +
        </button>
      </div>
      <button
        onClick={handleAdd}
        className="flex-1 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
      >
        Add {quantity} to Cart
      </button>
    </div>
  );
}

// Pattern 6: Complete product showcase
export function CompleteExample() {
  const { addItem, openCart } = useCart();
  const [selectedSize, setSelectedSize] = useState("small");
  const [selectedColor, setSelectedColor] = useState("rose");

  const handleAdd = () => {
    addItem({
      id: "complete-example",
      name: "Silk Rose Balm",
      price: 26,
      image: "/r5.jpg",
      variant: `${selectedSize} - ${selectedColor}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-md border border-gray-200 rounded-lg overflow-hidden"
    >
      <div className="relative aspect-square bg-gray-100">
        <Image
          src="/r5.jpg"
          alt="Silk Rose Balm"
          fill
          className="object-cover"
          sizes="400px"
        />
      </div>

      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900">Silk Rose Balm</h2>
        <p className="text-gray-600 mt-1">Nourishing cloud balm</p>
        <p className="text-xl font-semibold text-gray-900 mt-4">$26</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="small">Small (0.5 oz)</option>
              <option value="medium">Medium (1 oz)</option>
              <option value="large">Large (2 oz)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {["rose", "coral", "nude"].map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`h-10 w-10 rounded-full border-2 transition-all capitalize ${
                    selectedColor === color
                      ? "border-gray-900 scale-110"
                      : "border-gray-300"
                  }`}
                  title={color}
                >
                  {color[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAdd}
          className="mt-6 w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Add to Cart
        </motion.button>

        <button
          onClick={openCart}
          className="mt-3 w-full py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          View Cart
        </button>
      </div>
    </motion.div>
  );
}

// Export all patterns for reference
export default function ExamplesShowcase() {
  return (
    <div className="p-8 space-y-12 max-w-4xl mx-auto">
      <section>
        <h2 className="text-2xl font-bold mb-4">Pattern 1: Simple Button</h2>
        <SimpleAddButton />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">
          Pattern 2: Variant Selection
        </h2>
        <VariantSelector />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Pattern 3: Product Grid</h2>
        <ProductGridExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Pattern 4: Cart Status</h2>
        <CartStatus />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Pattern 5: Quantity Input</h2>
        <QuantityInput />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Pattern 6: Complete Product</h2>
        <CompleteExample />
      </section>
    </div>
  );
}
