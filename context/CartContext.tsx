"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface CartItem {
  lineId: string;
  variantId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isOpen: boolean;
  isLoading: boolean;
  addItem: (item: {
    variantId: string;
    name: string;
    price: number;
    image: string;
  }) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  goToCheckout: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_ID_KEY = "shopify_cart_id";

async function cartAPI(body: Record<string, unknown>) {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Cart operation failed");
  return res.json();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Restore cart from localStorage on mount
  useEffect(() => {
    const savedCartId = localStorage.getItem(CART_ID_KEY);
    if (!savedCartId) return;

    fetch(`/api/cart?cartId=${encodeURIComponent(savedCartId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cart) => {
        if (!cart) {
          localStorage.removeItem(CART_ID_KEY);
          return;
        }
        setCartId(cart.id);
        setCheckoutUrl(cart.checkoutUrl);
        setItems(cart.lines);
      })
      .catch(() => localStorage.removeItem(CART_ID_KEY));
  }, []);

  const syncCart = useCallback(
    (cart: { id: string; checkoutUrl: string; lines: CartItem[] }) => {
      setCartId(cart.id);
      setCheckoutUrl(cart.checkoutUrl);
      setItems(cart.lines);
      localStorage.setItem(CART_ID_KEY, cart.id);
    },
    []
  );

  const addItem = useCallback(
    async (item: {
      variantId: string;
      name: string;
      price: number;
      image: string;
    }) => {
      setIsLoading(true);
      try {
        const existingCartId = localStorage.getItem(CART_ID_KEY);

        let cart;
        if (!existingCartId) {
          cart = await cartAPI({ action: "create", variantId: item.variantId, quantity: 1 });
        } else {
          cart = await cartAPI({
            action: "add",
            cartId: existingCartId,
            variantId: item.variantId,
            quantity: 1,
          });
        }

        syncCart(cart);
        setIsOpen(true);
      } catch (error) {
        // If cart is stale/expired, create a new one
        localStorage.removeItem(CART_ID_KEY);
        try {
          const cart = await cartAPI({ action: "create", variantId: item.variantId, quantity: 1 });
          syncCart(cart);
          setIsOpen(true);
        } catch {
          console.error("Failed to add item to cart:", error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [syncCart]
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      if (!cartId) return;
      setIsLoading(true);
      try {
        const cart = await cartAPI({ action: "remove", cartId, lineId });
        syncCart(cart);
      } catch (error) {
        console.error("Failed to remove item:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [cartId, syncCart]
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cartId) return;
      if (quantity <= 0) {
        await removeItem(lineId);
        return;
      }
      setIsLoading(true);
      try {
        const cart = await cartAPI({ action: "update", cartId, lineId, quantity });
        syncCart(cart);
      } catch (error) {
        console.error("Failed to update quantity:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [cartId, syncCart, removeItem]
  );

  const getTotalItems = useCallback(
    () => items.reduce((t, i) => t + i.quantity, 0),
    [items]
  );

  const getTotalPrice = useCallback(
    () => items.reduce((t, i) => t + i.price * i.quantity, 0),
    [items]
  );

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  // Link the cart to the logged-in customer (if any) right before redirecting,
  // so checkout is pre-filled even when the cart was built while logged out.
  const goToCheckout = useCallback(async () => {
    if (!checkoutUrl) return;
    try {
      if (cartId) await cartAPI({ action: "link", cartId });
    } catch {
      // non-fatal — proceed to checkout regardless
    }
    window.location.href = checkoutUrl;
  }, [cartId, checkoutUrl]);

  return (
    <CartContext.Provider
      value={{
        items,
        cartId,
        checkoutUrl,
        isOpen,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        openCart,
        closeCart,
        goToCheckout,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
