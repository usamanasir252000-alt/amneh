# 🛒 Shopping Cart - Quick Reference Card

## 📍 File Locations

```
d:\Amneh\Project\
├── context/
│   └── CartContext.tsx (NEW) ...................... State management
├── components/
│   ├── CartDrawer.tsx (NEW) ....................... Cart UI
│   ├── ProductQuickAdd.tsx (NEW) .................. Add button wrapper
│   ├── CartExamples.tsx (NEW) ..................... 6 pattern examples
│   ├── Navbar.tsx (MODIFIED) ..................... + badge & button
│   └── ProductCarousel.tsx (MODIFIED) ............ + quick add
├── app/
│   └── layout.tsx (MODIFIED) ..................... + CartProvider
├── CART_SETUP_COMPLETE.md (NEW) .................. Full guide
└── CART_IMPLEMENTATION.md (NEW) .................. Implementation guide
```

---

## 🎯 Most Used Code

### Add Product to Cart

```tsx
const { addItem } = useCart();

addItem({
  id: "product-1",
  name: "Hydrating Serum",
  price: 38,
  image: "/serum.jpg",
});
```

### Get Cart Info

```tsx
const { getTotalItems, getTotalPrice, openCart } = useCart();

{
  getTotalItems();
} // "2"
{
  getTotalPrice().toFixed(2);
} // "57.00"
openCart(); // Open drawer
```

### In a Component

```tsx
"use client";
import { useCart } from "@/context/CartContext";

export default function MyComponent() {
  const { addItem, openCart, getTotalItems } = useCart();

  return (
    <>
      <button onClick={() => addItem({...})}>
        Add to Cart
      </button>
      <span>Items: {getTotalItems()}</span>
    </>
  );
}
```

---

## 🎨 Styling Reference

### Badge in Navbar

- **Color:** `bg-rose-400` (matches your design mockup)
- **Size:** 20px × 20px (h-5 w-5)
- **Position:** Top-right of cart icon (-top-2 -right-2)
- **Text:** Bold white, 11px font

### Cart Drawer

- **Position:** Right side of screen
- **Width:** Max 448px (max-w-md)
- **Animation:** Slides in 0.35s from right
- **Backdrop:** Black 20% with blur

### Free Shipping Banner

- **Background:** Rose-50 (`bg-rose-50`)
- **Border:** Rose-100 (`border-rose-100`)
- **Text:** Gray-900 for title, gray-600 for description

---

## ✅ Verification Checklist

- [x] CartContext created and exports useCart hook
- [x] CartDrawer component displays items correctly
- [x] ProductQuickAdd button component works
- [x] Navbar shows cart icon with badge
- [x] CartProvider wraps app in layout
- [x] ProductCarousel integrated with quick add
- [x] All imports resolve correctly (@/ paths work)
- [x] No TypeScript errors
- [x] Animations work smoothly
- [x] Mobile responsive design

---

## 🚀 Test These Features

1. **Badge Appears**
   - Click "Add to Cart" on any product
   - Check if badge shows number in navbar
   - Should scale up with animation

2. **Cart Opens Automatically**
   - Add product → drawer should slide in
   - See product in cart with image and price
   - Can adjust quantity with +/- buttons

3. **Badge Updates**
   - Add another product → badge changes
   - Remove item → badge decreases
   - Multiple quantities increase badge correctly

4. **Free Shipping Upsell**
   - Add items under $50 → see "spend more" message
   - Add items totaling ≥$50 → see "qualifies for free shipping"

5. **Responsive Drawer**
   - Open on desktop → narrow right sidebar
   - Open on mobile → full-width drawer
   - Close button works
   - Backdrop click closes drawer

---

## 💡 Pro Tips

- **Variants are optional:** You can add products without specifying a variant
- **Same product check:** If you add same product with same variant, quantity increases (no duplicates)
- **Manual control:** Use `openCart()` / `closeCart()` to control drawer manually
- **Clear all:** Use `clearCart()` to empty the cart completely
- **Price format:** Always use number type for price, not string

---

## 🔄 Common Patterns

### Pattern A: Simple Button

```tsx
const { addItem } = useCart();
<button
  onClick={() => addItem({ id: "1", name: "Item", price: 29, image: "/" })}
>
  Add
</button>;
```

### Pattern B: With Variant

```tsx
addItem({
  id: "lip-butter",
  name: "Lip Butter",
  price: 28,
  image: "/lip.jpg",
  variant: "vanilla caramel", // <- Added
});
```

### Pattern C: Show Status

```tsx
const { getTotalItems } = useCart();
<span className="badge">{getTotalItems()}</span>;
```

### Pattern D: Open Cart Button

```tsx
const { openCart } = useCart();
<button onClick={openCart}>View Cart</button>;
```

---

## 🎓 Example Files to Reference

- `components/CartExamples.tsx` - 6 complete working examples
- `components/ProductCarousel.tsx` - Real integration example
- `context/CartContext.tsx` - Full state management code
- `components/CartDrawer.tsx` - Complete UI code

---

## 📱 Mobile Considerations

- Drawer is full-width on mobile (max-w-md prevents overflow on desktop)
- Cart icon is always visible in navbar
- Badge scales properly on all screen sizes
- Quantity buttons have good touch targets (h-7 w-7)
- Responsive grid layout in cart items list

---

## 🛠️ If Something Breaks

**Module not found error?**
→ Check tsconfig.json has baseUrl and paths configured ✓

**Drawer not opening?**
→ Verify CartDrawer is in app/layout.tsx ✓

**Badge not showing?**
→ Check getTotalItems() > 0 and items in cart ✓

**TypeScript errors?**
→ Make sure "use client" is at top of component ✓

**Imports failing?**
→ Verify folder structure matches: context/ and components/ exist ✓

---

## 📊 Cart Data Flow

```
User clicks "Add to Cart"
        ↓
ProductQuickAdd.tsx calls addItem()
        ↓
CartContext updates items array
        ↓
setState triggers re-render + auto-opens drawer
        ↓
Navbar re-renders, badge shows getTotalItems()
        ↓
CartDrawer displays updated items list
        ↓
User sees new item, can adjust quantity or remove
```

---

## 🎁 Features Included

✅ Auto-open drawer on add
✅ Live badge counter
✅ Quantity adjustments
✅ Remove items
✅ Free shipping upsell
✅ Smooth animations
✅ Responsive design
✅ Variant support
✅ Duplicate prevention
✅ Item count total
✅ Subtotal calculation
✅ Mobile optimized

---

**Everything is ready to use! Start adding products to test the cart system.**
