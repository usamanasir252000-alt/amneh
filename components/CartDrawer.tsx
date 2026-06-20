"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCart, CartItem } from "@/context/CartContext";
import Image from "next/image";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    isLoading,
    checkoutUrl,
    closeCart,
    removeItem,
    updateQuantity,
    getTotalPrice,
  } = useCart();

  const totalPrice = getTotalPrice();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                cart <span className="text-gray-500">{items.length} items</span>
              </h2>
              <button
                onClick={closeCart}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close cart"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Cart Content */}
            <div className="p-6">
              {items.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <svg
                    className="h-16 w-16 text-gray-200 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-4 mb-6">
                    <AnimatePresence mode="popLayout">
                      {items.map((item: CartItem) => (
                        <motion.div
                          key={item.lineId}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex gap-4 border-b border-gray-100 pb-4"
                        >
                          {/* Image */}
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {item.name}
                            </h3>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              PKR {(item.price * item.quantity).toFixed(2)}
                            </p>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                onClick={() =>
                                  updateQuantity(item.lineId, item.quantity - 1)
                                }
                                className="h-7 w-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                −
                              </button>
                              <span className="w-6 text-center text-sm">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.lineId, item.quantity + 1)
                                }
                                className="h-7 w-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeItem(item.lineId)}
                                className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
                              >
                                remove
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Summary */}
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        PKR {totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      shipping & discounts calculated at checkout
                    </p>
                  </div>

                  {/* Checkout Button */}
                  <motion.a
                    href={checkoutUrl ?? "#"}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-6 w-full bg-gray-900 text-white font-medium py-3 rounded transition-colors hover:bg-gray-800 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "checkout"
                    )}
                  </motion.a>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
