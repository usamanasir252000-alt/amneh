"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { fbTrack } from "@/lib/fbpixel";
import { fetchWithRetry } from "@/lib/fetchRetry";
import { logEvent } from "@/lib/clientLog";
import { bundleDiscountCodes } from "@/lib/bundle";
import { LEFT_FOR_CHECKOUT_KEY } from "@/components/BFCacheReload";

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
    quantity?: number;
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
  // Retry a dropped connection (net::ERR_HTTP2_PING_FAILED / timeout) once, so a
  // network wobble doesn't fail Add-to-Cart or the checkout link. We deliberately
  // do NOT retry on a 5xx server response (retryOnServerError: false): a mutating
  // POST the server may have already applied shouldn't be replayed. A pure
  // connection drop means the request almost certainly never completed, so
  // replaying it is safe.
  const res = await fetchWithRetry("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs: 15000,
    retries: 1,
    retryOnServerError: false,
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

    fetchWithRetry(`/api/cart?cartId=${encodeURIComponent(savedCartId)}`, {
      timeoutMs: 10000,
      retries: 2,
    })
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
      quantity?: number;
    }) => {
      const qty = Math.max(1, item.quantity ?? 1);
      setIsLoading(true);
      logEvent("add_to_cart_attempt", { variantId: item.variantId, name: item.name, price: item.price, quantity: qty });
      fbTrack("AddToCart", {
        content_ids: [item.variantId],
        content_name: item.name,
        content_type: "product",
        value: item.price * qty,
        currency: "PKR",
      });
      try {
        const existingCartId = localStorage.getItem(CART_ID_KEY);

        let cart;
        if (!existingCartId) {
          cart = await cartAPI({ action: "create", variantId: item.variantId, quantity: qty });
        } else {
          cart = await cartAPI({
            action: "add",
            cartId: existingCartId,
            variantId: item.variantId,
            quantity: qty,
          });
        }

        syncCart(cart);
        setIsOpen(true);
        logEvent("add_to_cart_success", { variantId: item.variantId, cartId: cart.id });
      } catch (error) {
        // If cart is stale/expired, create a new one
        localStorage.removeItem(CART_ID_KEY);
        try {
          const cart = await cartAPI({ action: "create", variantId: item.variantId, quantity: qty });
          syncCart(cart);
          setIsOpen(true);
          logEvent("add_to_cart_success", { variantId: item.variantId, cartId: cart.id, recovered: true });
        } catch (retryError) {
          console.error("Failed to add item to cart:", error);
          logEvent("add_to_cart_failed", {
            variantId: item.variantId,
            firstError: (error as Error)?.message,
            retryError: (retryError as Error)?.message,
          });
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
    const value = items.reduce((t, i) => t + i.price * i.quantity, 0);
    const numItems = items.reduce((t, i) => t + i.quantity, 0);
    logEvent("checkout_click", { cartId, value, numItems });
    fbTrack("InitiateCheckout", {
      value,
      currency: "PKR",
      num_items: numItems,
      content_ids: items.map((i) => i.variantId),
    });
    // Apply the bundle discount codes matching the cart's total quantity
    // (%-off + free shipping, e.g. BUNDLE10 + FREEBUNDLE10 at 3+) so the
    // "buy more, save more" saving is on the cart before checkout. Capped so
    // it can never hang the redirect; if it fails they checkout without it.
    const bundleCodes = bundleDiscountCodes(numItems, value);
    if (cartId && bundleCodes.length > 0) {
      try {
        await Promise.race([
          cartAPI({ action: "discount", cartId, discountCodes: bundleCodes }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("discount-timeout")), 4000)),
        ]);
      } catch {
        logEvent("bundle_discount_timeout", { cartId, bundleCodes });
      }
    }

    // Link at navigation time and prefer the fresh checkout URL returned by the
    // server — it carries the authenticated customer session into checkout.
    // Capped with a timeout so a slow link call can NEVER block the redirect
    // (that was the "checkout loads forever" bug); we fall back to the cached URL.
    let url = checkoutUrl;
    if (cartId) {
      try {
        const res = await Promise.race([
          cartAPI({ action: "link", cartId }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("link-timeout")), 4000)
          ),
        ]);
        if (res?.checkoutUrl) url = res.checkoutUrl;
      } catch {
        // timed out or failed — proceed to checkout with the cached URL
        logEvent("checkout_link_timeout", { cartId });
      }
    }
    logEvent("checkout_redirect", { cartId, usedFallbackUrl: url === checkoutUrl });
    // Mark that we're leaving the site for checkout, so returning via Back
    // forces a clean reload instead of a stuck/frozen page (see BFCacheReload).
    sessionStorage.setItem(LEFT_FOR_CHECKOUT_KEY, "1");
    window.location.href = url;
  }, [cartId, checkoutUrl, items]);

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
