"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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

interface ServerCart {
  id: string;
  checkoutUrl: string;
  lines: CartItem[];
}

interface CartContextType {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isOpen: boolean;
  isLoading: boolean;
  isCheckingOut: boolean;
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

let tempIdSeq = 0;
const isTempLineId = (lineId: string) => lineId.startsWith("tmp-");

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

// The UI is optimistic: taps update local state instantly and the Shopify
// round-trips run in the background. Mutations are serialized through a
// promise chain so rapid taps can never race (e.g. two "create" calls making
// two different carts), and the server's line items are only adopted when no
// newer mutation is still pending, so a stale response can't clobber what the
// user sees.
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const opChain = useRef<Promise<void>>(Promise.resolve());
  const pendingOps = useRef(0);
  const cartIdRef = useRef<string | null>(null);
  const checkoutUrlRef = useRef<string | null>(null);
  const lastServerCart = useRef<ServerCart | null>(null);
  // optimistic lineId -> variantId, so a +/− or remove tap on a line that
  // hasn't reached the server yet can be resolved to the real lineId once
  // the add completes.
  const tempLines = useRef(new Map<string, string>());

  const applyServerCart = useCallback((cart: ServerCart) => {
    lastServerCart.current = cart;
    cartIdRef.current = cart.id;
    checkoutUrlRef.current = cart.checkoutUrl;
    setCartId(cart.id);
    setCheckoutUrl(cart.checkoutUrl);
    localStorage.setItem(CART_ID_KEY, cart.id);
    // Only adopt the server's line items when this is the last pending
    // mutation — otherwise it would overwrite newer optimistic state.
    if (pendingOps.current <= 1) {
      setItems(cart.lines);
      tempLines.current.clear();
    }
  }, []);

  const enqueue = useCallback((op: () => Promise<void>) => {
    pendingOps.current += 1;
    setIsLoading(true);
    const run = opChain.current.then(op).finally(() => {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsLoading(false);
    });
    opChain.current = run.catch(() => {});
    return run;
  }, []);

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
        if (pendingOps.current === 0) {
          applyServerCart(cart);
        }
      })
      .catch(() => localStorage.removeItem(CART_ID_KEY));
  }, [applyServerCart]);

  // Refetch the server cart to reconcile local state after a failed mutation.
  const reconcile = useCallback(async () => {
    const id = cartIdRef.current ?? localStorage.getItem(CART_ID_KEY);
    if (!id) return;
    try {
      const r = await fetchWithRetry(`/api/cart?cartId=${encodeURIComponent(id)}`, {
        timeoutMs: 10000,
        retries: 1,
      });
      const cart = r.ok ? await r.json() : null;
      if (cart) applyServerCart(cart);
    } catch {
      // offline — leave optimistic state; next successful op resyncs
    }
  }, [applyServerCart]);

  const resolveLineId = useCallback((lineId: string): string | null => {
    if (!isTempLineId(lineId)) return lineId;
    const variantId = tempLines.current.get(lineId);
    if (!variantId) return null;
    const serverLine = lastServerCart.current?.lines.find(
      (l) => l.variantId === variantId
    );
    return serverLine?.lineId ?? null;
  }, []);

  const addItem = useCallback(
    async (item: {
      variantId: string;
      name: string;
      price: number;
      image: string;
      quantity?: number;
    }) => {
      const qty = Math.max(1, item.quantity ?? 1);
      logEvent("add_to_cart_attempt", { variantId: item.variantId, name: item.name, price: item.price, quantity: qty });
      fbTrack("AddToCart", {
        content_ids: [item.variantId],
        content_name: item.name,
        content_type: "product",
        value: item.price * qty,
        currency: "PKR",
      });

      // Optimistic: the line appears and the drawer opens on the same tap.
      const tempLineId = `tmp-${++tempIdSeq}-${item.variantId}`;
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === item.variantId);
        if (existing) {
          return prev.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + qty }
              : i
          );
        }
        tempLines.current.set(tempLineId, item.variantId);
        return [
          ...prev,
          {
            lineId: tempLineId,
            variantId: item.variantId,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: qty,
          },
        ];
      });
      setIsOpen(true);

      await enqueue(async () => {
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

          applyServerCart(cart);
          logEvent("add_to_cart_success", { variantId: item.variantId, cartId: cart.id });
        } catch (error) {
          // If cart is stale/expired, create a new one
          localStorage.removeItem(CART_ID_KEY);
          try {
            const cart = await cartAPI({ action: "create", variantId: item.variantId, quantity: qty });
            applyServerCart(cart);
            logEvent("add_to_cart_success", { variantId: item.variantId, cartId: cart.id, recovered: true });
          } catch (retryError) {
            // Roll back the optimistic line
            setItems((prev) =>
              prev
                .map((i) =>
                  i.variantId === item.variantId
                    ? { ...i, quantity: i.quantity - qty }
                    : i
                )
                .filter((i) => i.quantity > 0)
            );
            console.error("Failed to add item to cart:", error);
            logEvent("add_to_cart_failed", {
              variantId: item.variantId,
              firstError: (error as Error)?.message,
              retryError: (retryError as Error)?.message,
            });
          }
        }
      });
    },
    [enqueue, applyServerCart]
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      setItems((prev) => prev.filter((i) => i.lineId !== lineId));
      await enqueue(async () => {
        try {
          const id = cartIdRef.current ?? localStorage.getItem(CART_ID_KEY);
          const realLineId = resolveLineId(lineId);
          if (!id || !realLineId) return;
          const cart = await cartAPI({ action: "remove", cartId: id, lineId: realLineId });
          applyServerCart(cart);
        } catch (error) {
          console.error("Failed to remove item:", error);
          await reconcile();
        }
      });
    },
    [enqueue, applyServerCart, resolveLineId, reconcile]
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(lineId);
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.lineId === lineId ? { ...i, quantity } : i))
      );
      await enqueue(async () => {
        try {
          const id = cartIdRef.current ?? localStorage.getItem(CART_ID_KEY);
          const realLineId = resolveLineId(lineId);
          if (!id || !realLineId) return;
          const cart = await cartAPI({ action: "update", cartId: id, lineId: realLineId, quantity });
          applyServerCart(cart);
        } catch (error) {
          console.error("Failed to update quantity:", error);
          await reconcile();
        }
      });
    },
    [enqueue, applyServerCart, resolveLineId, reconcile, removeItem]
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
    if (isCheckingOut) return;
    setIsCheckingOut(true);
    const value = items.reduce((t, i) => t + i.price * i.quantity, 0);
    const numItems = items.reduce((t, i) => t + i.quantity, 0);
    logEvent("checkout_click", { cartId: cartIdRef.current, value, numItems });
    fbTrack("InitiateCheckout", {
      value,
      currency: "PKR",
      num_items: numItems,
      content_ids: items.map((i) => i.variantId),
    });

    try {
      // Cart mutations are optimistic, so a just-tapped add/± may still be in
      // flight. Wait for the queue (capped) so checkout matches what's on
      // screen; past the cap we go with whatever the server has.
      await Promise.race([
        opChain.current,
        new Promise((resolve) => setTimeout(resolve, 6000)),
      ]);

      const id = cartIdRef.current;
      const cachedUrl = checkoutUrlRef.current;
      if (!cachedUrl) {
        logEvent("checkout_no_url", { cartId: id });
        return;
      }
      let url: string = cachedUrl;

      // Apply the bundle discount codes matching the cart's total quantity
      // (%-off + free shipping, e.g. BUNDLE10 + FREEBUNDLE10 at 3+) so the
      // "buy more, save more" saving is on the cart before checkout, and link
      // the cart to the logged-in customer for a pre-filled checkout. Both run
      // concurrently and are capped so neither can hang the redirect; if they
      // fail the shopper checks out without them.
      const bundleCodes = bundleDiscountCodes(numItems, value);
      const capped = <T,>(p: Promise<T>, label: string): Promise<T | null> =>
        Promise.race([
          p,
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error(`${label}-timeout`)), 4000)
          ),
        ]).catch(() => {
          logEvent(`${label}_timeout`, { cartId: id });
          return null;
        });

      const [, linkRes] = await Promise.all([
        id && bundleCodes.length > 0
          ? capped(cartAPI({ action: "discount", cartId: id, discountCodes: bundleCodes }), "bundle_discount")
          : Promise.resolve(null),
        id ? capped(cartAPI({ action: "link", cartId: id }), "checkout_link") : Promise.resolve(null),
      ]);
      // Prefer the fresh checkout URL returned by the link — it carries the
      // authenticated customer session into checkout.
      if (linkRes?.checkoutUrl) url = linkRes.checkoutUrl;

      logEvent("checkout_redirect", { cartId: id, usedFallbackUrl: url === checkoutUrlRef.current });
      // Mark that we're leaving the site for checkout, so returning via Back
      // forces a clean reload instead of a stuck/frozen page (see BFCacheReload).
      sessionStorage.setItem(LEFT_FOR_CHECKOUT_KEY, "1");
      window.location.href = url;
    } finally {
      // Reset after a beat so the spinner persists through the redirect but
      // recovers if navigation never happened (no URL / user came Back).
      setTimeout(() => setIsCheckingOut(false), 4000);
    }
  }, [isCheckingOut, items]);

  return (
    <CartContext.Provider
      value={{
        items,
        cartId,
        checkoutUrl,
        isOpen,
        isLoading,
        isCheckingOut,
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
