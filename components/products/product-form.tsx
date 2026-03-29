"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, ImageIcon, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { ProductDto, ProductValidation } from "@/types/models";
import { toast } from "sonner";

interface ProductFormProps {
  initialData?: ProductDto;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<ProductDto>>({
    productId: initialData?.productId || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    category: initialData?.category || "",
    stockQuantity: initialData?.stockQuantity || 0,
    barcode: initialData?.barcode || "",
    supplier: initialData?.supplier || "",
    isActive: initialData !== undefined ? initialData.isActive : true,
    costPrice: initialData?.costPrice || 0,
    sku: initialData?.sku || "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images || []);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!initialData;

  const validateFormData = (data: Partial<ProductDto>): FormErrors => {
    const newErrors: FormErrors = {};

    if (!isEditing) {
      if (!data.productId?.trim()) {
        newErrors.productId = "Product ID is required";
      } else if (!ProductValidation.productId.pattern.test(data.productId)) {
        newErrors.productId = ProductValidation.productId.message;
      }
    }

    if (!data.name?.trim()) {
      newErrors.name = "Product name is required";
    } else if (data.name.length > ProductValidation.name.max) {
      newErrors.name = ProductValidation.name.message;
    }

    if (data.description && data.description.length > ProductValidation.description.max) {
      newErrors.description = ProductValidation.description.message;
    }

    if (!data.price || data.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!data.category?.trim()) {
      newErrors.category = "Category is required";
    } else if (data.category.length > ProductValidation.category.max) {
      newErrors.category = ProductValidation.category.message;
    }

    if (data.stockQuantity === undefined || data.stockQuantity === null || data.stockQuantity < 0) {
      newErrors.stockQuantity = "Stock quantity must be >= 0";
    }

    if (data.barcode && !ProductValidation.barcode.pattern.test(data.barcode)) {
      newErrors.barcode = ProductValidation.barcode.message;
    }

    if (data.supplier && data.supplier.length > ProductValidation.supplier.max) {
      newErrors.supplier = ProductValidation.supplier.message;
    }

    if (data.sku && !ProductValidation.sku.pattern.test(data.sku)) {
      newErrors.sku = ProductValidation.sku.message;
    }

    if (data.costPrice !== undefined && data.costPrice !== null && data.costPrice < 0) {
      newErrors.costPrice = ProductValidation.costPrice.message;
    }

    return newErrors;
  };

  useEffect(() => {
    const previews = newImages.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(previews);

    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewImages((prev) => [...prev, ...filesArray]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
    setImagesToDelete((prev) => [...prev, url]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validationErrors = validateFormData(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toast.error("Please fix validation errors before submitting");
        setIsSubmitting(false);
        return;
      }

      const url = isEditing ? `/api/products/${formData.productId}` : `/api/products`;
      const method = isEditing ? "PUT" : "POST";

      const cleanPayload: Record<string, unknown> = {
        productId: formData.productId,
        name: formData.name,
        price: formData.price,
        category: formData.category,
        stockQuantity: formData.stockQuantity,
        isActive: formData.isActive ?? true,
      };

      if (formData.description?.trim()) cleanPayload.description = formData.description.trim();
      if (formData.barcode?.trim()) cleanPayload.barcode = formData.barcode.trim();
      if (formData.supplier?.trim()) cleanPayload.supplier = formData.supplier.trim();
      if (formData.sku?.trim()) cleanPayload.sku = formData.sku.trim();
      if (formData.costPrice && formData.costPrice > 0) cleanPayload.costPrice = formData.costPrice;

      const data = new FormData();
      data.append("product", JSON.stringify(cleanPayload));

      if (isEditing) {
        newImages.forEach((image) => {
          data.append("newImages", image);
        });
        imagesToDelete.forEach((imgUrl) => {
          data.append("imagesToDelete", imgUrl);
        });
      } else {
        newImages.forEach((image) => {
          data.append("images", image);
        });
      }

      const response = await fetch(url, {
        method,
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to save product: ${response.statusText}`);
      }

      toast.success(`Product ${isEditing ? "updated" : "created"} successfully!`);
      onSuccess();
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "An error occurred while saving the product.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `h-11 rounded-2xl border px-4 ${errors[field] ? "border-red-500 bg-red-50/40" : "border-black/10 bg-black/[0.02]"}`;

  return (
    <form onSubmit={handleSubmit} className="max-h-[85vh] overflow-y-auto px-6 py-6">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-black">Product details</h3>
              <p className="mt-1 text-sm text-black/55">Core product information used in the POS catalog.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="productId">Product ID</Label>
                <Input
                  id="productId"
                  name="productId"
                  required
                  disabled={isEditing}
                  value={formData.productId}
                  onChange={handleChange}
                  placeholder="PROD001"
                  className={inputClass("productId")}
                />
                {errors.productId ? (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {errors.productId}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required value={formData.name} onChange={handleChange} className={inputClass("name")} />
                {errors.name ? (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {errors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`min-h-[120px] w-full rounded-[24px] border px-4 py-3 text-sm outline-none transition focus:border-black/25 focus:ring-4 focus:ring-black/5 ${
                    errors.description ? "border-red-500 bg-red-50/40" : "border-black/10 bg-black/[0.02]"
                  }`}
                />
                {errors.description ? (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {errors.description}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className={inputClass("price")}
                />
                {errors.price ? (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {errors.price}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price ($)</Label>
                <Input
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={handleChange}
                  className={inputClass("costPrice")}
                />
                {errors.costPrice ? (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {errors.costPrice}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  required
                  min="0"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  className={inputClass("stockQuantity")}
                />
                {errors.stockQuantity ? (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {errors.stockQuantity}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className={inputClass("category")}
                />
                {errors.category ? (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {errors.category}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-black">Store metadata</h3>
              <p className="mt-1 text-sm text-black/55">Extra supplier and identification details.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} className={inputClass("supplier")} />
                {errors.supplier ? (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {errors.supplier}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} className={inputClass("sku")} />
                {errors.sku ? (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {errors.sku}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" name="barcode" value={formData.barcode} onChange={handleChange} className={inputClass("barcode")} />
                {errors.barcode ? (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" /> {errors.barcode}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center rounded-[24px] border border-black/8 bg-black/[0.02] px-4 py-4">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-black/20 text-black focus:ring-black/20"
                />
                <Label htmlFor="isActive" className="ml-3 text-sm font-medium text-black/75">
                  Active and visible in the POS catalog
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-black">Product images</h3>
                <p className="mt-1 text-sm text-black/55">Upload photos used in the catalog and POS grid.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border-black/10 bg-white px-4 text-black hover:bg-black/[0.03]"
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="hidden"
              />
            </div>

            {existingImages.length > 0 || newImagePreviews.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {existingImages.map((url, index) => (
                  <div
                    key={`existing-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-[24px] border border-black/8 bg-black/[0.03]"
                  >
                    <Image
                      src={getProxiedImageUrl(url)}
                      alt={`Existing product ${index}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => removeExistingImage(url)}
                        className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {newImagePreviews.map((preview, index) => (
                  <div
                    key={`new-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-[24px] border border-black/8 bg-black/[0.03]"
                  >
                    <div className="absolute left-3 top-3 z-10 rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                      New
                    </div>
                    <Image src={preview} alt={`New upload ${index}`} fill className="object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => removeNewImage(index)}
                        className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                className="flex w-full flex-col items-center justify-center rounded-[28px] border border-dashed border-black/14 bg-black/[0.02] px-6 py-12 text-center transition hover:bg-black/[0.03]"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-8 w-8 text-black/35" />
                <p className="mt-4 text-sm font-medium text-black">Click to upload images</p>
                <p className="mt-1 text-xs text-black/45">JPG, PNG, or GIF files up to 5MB</p>
              </button>
            )}
          </div>

          <div className="rounded-[28px] border border-black/8 bg-[linear-gradient(180deg,_#111111,_#262626)] p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Product status</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
              {formData.isActive ? "Ready for sale" : "Hidden from checkout"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/72">
              Keep products active when they should appear in the POS product grid and customer-facing workflows.
            </p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-black/6 bg-white/95 px-1 pt-5 backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-11 rounded-2xl border-black/10 bg-white px-5 text-black hover:bg-black/[0.03]"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90">
          {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
