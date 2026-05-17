"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  type: string;
  price: number;
  shades: string;
  badge: string;
  tagline: string | null;
  description: string | null;
  category: string;
  images: ProductImage[];
}

interface Props {
  product?: Product;
}

export default function ProductEditForm({ product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const [fields, setFields] = useState({
    name: product?.name ?? "",
    type: product?.type ?? "",
    price: product?.price?.toString() ?? "",
    shades: product?.shades ?? "+1 shade",
    badge: product?.badge ?? "new",
    tagline: product?.tagline ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "all",
  });

  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      let productId = product?.id;

      if (isEdit) {
        const res = await fetch(`/api/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fields, price: Number(fields.price) }),
        });
        if (!res.ok) throw new Error("Failed to update product");
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fields, price: Number(fields.price) }),
        });
        if (!res.ok) throw new Error("Failed to create product");
        const created = await res.json();
        productId = created.id;

        // Upload images queued during creation
        for (let i = 0; i < images.length; i++) {
          await fetch(`/api/products/${productId}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: images[i].url, sortOrder: i }),
          });
        }
      }

      router.push("/admin/products");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your environment variables.");
      setUploading(false);
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    const url: string = data.secure_url;

    if (isEdit) {
      const sortOrder = images.length;
      const imgRes = await fetch(`/api/products/${product!.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, sortOrder }),
      });
      const newImg = await imgRes.json();
      setImages((prev) => [...prev, newImg]);
    } else {
      setImages((prev) => [...prev, { id: `temp-${Date.now()}`, url, sortOrder: prev.length }]);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteImage = async (img: ProductImage) => {
    if (isEdit) {
      await fetch(`/api/products/${product!.id}/images/${img.id}`, { method: "DELETE" });
    }
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const inputClass = "w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-gray-400 rounded";
  const labelClass = "block text-xs text-gray-500 mb-1 uppercase tracking-wide";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: fields */}
      <div className="lg:col-span-2 space-y-4 bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={fields.name} onChange={set("name")} placeholder="blush glow" />
          </div>
          <div>
            <label className={labelClass}>Type / Subtitle</label>
            <input className={inputClass} value={fields.type} onChange={set("type")} placeholder="hydrating serum" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Price ($)</label>
            <input className={inputClass} type="number" step="0.01" value={fields.price} onChange={set("price")} placeholder="38" />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={fields.category} onChange={set("category")}>
              <option value="all">All</option>
              <option value="skincare">Skincare</option>
              <option value="makeup">Makeup</option>
              <option value="fragrance">Fragrance</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Shades label</label>
            <input className={inputClass} value={fields.shades} onChange={set("shades")} placeholder="+3 shades" />
          </div>
          <div>
            <label className={labelClass}>Badge</label>
            <input className={inputClass} value={fields.badge} onChange={set("badge")} placeholder="new / best seller" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Tagline</label>
          <input className={inputClass} value={fields.tagline} onChange={set("tagline")} placeholder="Optional short tagline" />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea className={inputClass} rows={3} value={fields.description} onChange={set("description")} placeholder="Optional description" />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 text-white px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-700 transition disabled:opacity-50 rounded"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </button>
          <button
            onClick={() => router.back()}
            className="text-xs text-gray-500 hover:text-gray-900 transition px-4"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Right: images */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Product Images</p>
        <p className="text-xs text-gray-400 mb-4">First image = primary display. Second = hover image.</p>

        <div className="space-y-2 mb-4">
          {images.map((img, idx) => (
            <div key={img.id} className="flex items-center gap-3 group">
              <div className="relative w-14 h-14 bg-[#eeebe8] rounded overflow-hidden flex-shrink-0">
                <Image src={img.url} alt="" fill className="object-contain" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 truncate">{img.url}</p>
                <p className="text-[10px] text-gray-300">{idx === 0 ? "Primary" : idx === 1 ? "Hover" : `Image ${idx + 1}`}</p>
              </div>
              <button
                onClick={() => handleDeleteImage(img)}
                className="text-gray-300 hover:text-red-400 transition text-lg leading-none flex-shrink-0"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
          {images.length === 0 && (
            <p className="text-xs text-gray-300 text-center py-6">No images yet</p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border border-dashed border-gray-300 py-3 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition rounded disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "+ Upload Image"}
        </button>
      </div>
    </div>
  );
}
