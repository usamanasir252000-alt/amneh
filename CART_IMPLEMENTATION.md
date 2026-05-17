# Shopping Cart Implementation Guide

## Overview

A complete shopping cart system has been implemented with the following features:

- Real-time cart state management with React Context
- Auto-opening cart drawer when items are added
- Live item counter badge in the navbar
- Smooth animations and transitions
- Responsive drawer UI
- Free shipping threshold notification

## Components Overview

### 1. **CartContext** (`context/CartContext.tsx`)

Global state management for the shopping cart.

**Key Methods:**

```typescript
- addItem(item): Adds product to cart (auto-opens drawer)
- removeItem(id, variant): Removes item from cart
- updateQuantity(id, quantity, variant): Updates item quantity
- openCart() / closeCart(): Manually control drawer
- clearCart(): Clears all items
- getTotalItems(): Returns total item count
- getTotalPrice(): Returns subtotal
```

### 2. **CartDrawer** (`components/CartDrawer.tsx`)

Main cart UI component with:

- Product listing with images
- Quantity controls (+/- buttons)
- Remove item buttons
- Free shipping upsell banner
- Subtotal calculation
- Responsive mobile-optimized design

### 3. **ProductQuickAdd** (`components/ProductQuickAdd.tsx`)

Reusable button wrapper for adding products to cart.

**Usage:**

```tsx
<ProductQuickAdd
  id="product-1"
  name="Product Name"
  price={28}
  image="/product.jpg"
  variant="vanilla caramel" // optional
  className="your-button-classes"
>
  <button>Add to Cart</button>
</ProductQuickAdd>
```

### 4. **Updated Navbar** (`components/Navbar.tsx`)

- Cart icon with animated badge counter
- Badge appears only when items in cart
- Click opens cart drawer
- Badge color: Rose-400 (matching design mockup)

## Integration Examples

### Example 1: Product Card with Quick Add

```tsx
import ProductQuickAdd from "@/components/ProductQuickAdd";

export function ProductCard({ product }) {
  return (
    <ProductQuickAdd
      id={product.id}
      name={product.name}
      price={product.price}
      image={product.image}
      className="group cursor-pointer block w-full"
    >
      <div className="relative overflow-hidden bg-gray-100">
        <Image src={product.image} alt={product.name} fill />
      </div>
      <div className="mt-3">
        <h3>{product.name}</h3>
        <p>${product.price}</p>
      </div>
    </ProductQuickAdd>
  );
}
```

### Example 2: Standalone Add to Cart Button

```tsx
"use client";
import { useCart } from "@/context/CartContext";

export function AddToCartButton({ product }) {
  const { addItem } = useCart();

  return (
    <button
      onClick={() =>
        addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          variant: "color-name", // optional
        })
      }
      className="btn"
    >
      Add to Cart
    </button>
  );
}
```

### Example 3: With Variant Selection

```tsx
"use client";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

export function ProductWithVariants({ product }) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState("vanilla");

  return (
    <div>
      <select
        value={selectedVariant}
        onChange={(e) => setSelectedVariant(e.target.value)}
      >
        <option value="vanilla">Vanilla</option>
        <option value="rose">Rose</option>
      </select>
      <button
        onClick={() =>
          addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            variant: selectedVariant,
          })
        }
      >
        Add to Cart
      </button>
    </div>
  );
}
```

## Key Features

### 🎯 Auto-Open on Add

When `addItem()` is called, the cart drawer automatically opens.

### 📦 Duplicate Prevention

If the same product (with same variant) is added multiple times, quantity increases instead of creating duplicates.

### 🎨 Badge Styling

- Position: Top-right of cart icon
- Color: Rose-400 (`bg-rose-400`)
- Size: 20px × 20px
- Animation: Scale-in on first appearance
- Font: Bold, white text

### 🚚 Free Shipping Banner

- Shows when cart subtotal ≥ $50
- Displays upsell message when below threshold
- Includes threshold amount remaining

### 🎭 Smooth Animations

- Drawer slide-in/out (Framer Motion)
- Badge scale animation
- Item addition/removal animations
- Backdrop fade

## Data Structure

### CartItem Interface

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  variant?: string;
  quantity: number;
}
```

## Files Modified/Created

### Created:

- ✅ `context/CartContext.tsx` - State management
- ✅ `components/CartDrawer.tsx` - Cart UI
- ✅ `components/ProductQuickAdd.tsx` - Reusable add button

### Modified:

- ✅ `app/layout.tsx` - Added CartProvider wrapper
- ✅ `components/Navbar.tsx` - Added cart badge logic
- ✅ `components/ProductCarousel.tsx` - Integrated ProductQuickAdd

## Quick Start

1. **Wrap your app** with CartProvider (already done in `app/layout.tsx`)
2. **Import CartDrawer** in layout (already done)
3. **Use in components:**

```tsx
import { useCart } from "@/context/CartContext";

// Get cart state
const { items, getTotalItems, addItem, openCart } = useCart();

// Add product
addItem({
  id: "1",
  name: "Product",
  price: 29,
  image: "/image.jpg",
});

// Check total
const count = getTotalItems();
```

## Customization

### Change Badge Color

Edit `components/Navbar.tsx` line with `bg-rose-400` to your color.

### Change Free Shipping Threshold

Edit `components/CartDrawer.tsx` - change `50` in condition:

```tsx
const hasQualifiedForFreeShipping = totalPrice >= 50; // Change 50
```

### Modify Drawer Animation

Edit `components/CartDrawer.tsx` - adjust `transition` props:

```tsx
transition={{ duration: 0.35, ease: "easeInOut" }}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses CSS Grid and Flexbox
