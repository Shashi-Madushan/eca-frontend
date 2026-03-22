"use client";

import { useState, useRef, useEffect } from "react";
import { ProductDto, ProductValidation } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, UploadCloud, ImageIcon, AlertCircle } from "lucide-react";

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

  /**
   * Validate form data according to API specification
   */
  const validateFormData = (data: Partial<ProductDto>): FormErrors => {
    const newErrors: FormErrors = {};

    // Validate productId (required, 6-12 alphanumeric)
    if (!isEditing) {
      if (!data.productId?.trim()) {
        newErrors.productId = "Product ID is required";
      } else if (!ProductValidation.productId.pattern.test(data.productId)) {
        newErrors.productId = ProductValidation.productId.message;
      }
    }

    // Validate name (required, max 100)
    if (!data.name?.trim()) {
      newErrors.name = "Product name is required";
    } else if (data.name.length > ProductValidation.name.max) {
      newErrors.name = ProductValidation.name.message;
    }

    // Validate description (optional, max 500)
    if (data.description && data.description.length > ProductValidation.description.max) {
      newErrors.description = ProductValidation.description.message;
    }

    // Validate price (required, > 0)
    if (!data.price || data.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    // Validate category (required, max 50)
    if (!data.category?.trim()) {
      newErrors.category = "Category is required";
    } else if (data.category.length > ProductValidation.category.max) {
      newErrors.category = ProductValidation.category.message;
    }

    // Validate stockQuantity (required, >= 0)
    if (data.stockQuantity === undefined || data.stockQuantity === null || data.stockQuantity < 0) {
      newErrors.stockQuantity = "Stock quantity must be >= 0";
    }

    // Validate barcode (optional, 8-13 digits)
    if (data.barcode && !ProductValidation.barcode.pattern.test(data.barcode)) {
      newErrors.barcode = ProductValidation.barcode.message;
    }

    // Validate supplier (optional, max 100)
    if (data.supplier && data.supplier.length > ProductValidation.supplier.max) {
      newErrors.supplier = ProductValidation.supplier.message;
    }

    // Validate SKU (optional, 8-20 alphanumeric with hyphens)
    if (data.sku && !ProductValidation.sku.pattern.test(data.sku)) {
      newErrors.sku = ProductValidation.sku.message;
    }

    // Validate costPrice (optional, >= 0)
    if (data.costPrice !== undefined && data.costPrice !== null && data.costPrice < 0) {
      newErrors.costPrice = ProductValidation.costPrice.message;
    }

    return newErrors;
  };

  useEffect(() => {
    // Generate object URLs for previews
    const previews = newImages.map(file => URL.createObjectURL(file));
    setNewImagePreviews(previews);

    return () => {
      // Cleanup object URLs to avoid memory leaks
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [newImages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field when user starts editing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...filesArray]);
      // Clear input so same file can be selected again if removed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url));
    setImagesToDelete(prev => [...prev, url]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form data before submission
      const validationErrors = validateFormData(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toast.error("Please fix validation errors before submitting");
        setIsSubmitting(false);
        return;
      }

      const url = isEditing 
        ? `/api/products/${formData.productId}` 
        : `/api/products`;
      const method = isEditing ? "PUT" : "POST";

      // Build a clean payload — omit optional fields that are empty/zero
      // to avoid backend @Pattern validation failures on empty strings
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
      
      // The API expects 'product' part as JSON string
      data.append('product', JSON.stringify(cleanPayload));

      // Append new files with correct field names according to API spec
      if (isEditing) {
        newImages.forEach(image => {
          data.append('newImages', image);
        });
        imagesToDelete.forEach(imgUrl => {
          data.append('imagesToDelete', imgUrl);
        });
      } else {
        newImages.forEach(image => {
          data.append('images', image);
        });
      }

      const response = await fetch(url, {
        method,
        body: data,
        // Don't set Content-Type header manually - browser will set it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to save product: ${response.statusText}`);
      }

      toast.success(`Product ${isEditing ? 'updated' : 'created'} successfully!`);
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while saving the product.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6 max-h-[85vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-5">
        
        {/* Basic Info */}
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="productId" className="text-sm font-medium text-slate-700">Product ID <span className="text-red-500">*</span></Label>
          <Input 
            id="productId" 
            name="productId" 
            required 
            disabled={isEditing}
            value={formData.productId} 
            onChange={handleChange} 
            placeholder="e.g. PROD001"
            className={`rounded-lg shadow-sm border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 ${errors.productId ? 'border-red-500 ring-1 ring-red-500' : ''}`}
          />
          {errors.productId && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.productId}</p>}
        </div>
        
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium text-slate-700">Name <span className="text-red-500">*</span></Label>
          <Input 
            id="name" 
            name="name" 
            required 
            value={formData.name} 
            onChange={handleChange} 
            className={`rounded-lg shadow-sm border-slate-200 ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
          />
          {errors.name && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.name}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
          <textarea 
            id="description" 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            className={`flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${errors.description ? 'border-red-500 ring-red-500' : 'border-slate-200'}`}
          />
          {errors.description && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.description}</p>}
        </div>

        {/* Pricing & Stock */}
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="price" className="text-sm font-medium text-slate-700">Price ($) <span className="text-red-500">*</span></Label>
          <Input 
            id="price" 
            name="price" 
            type="number" 
            required 
            min="0"
            step="0.01"
            value={formData.price} 
            onChange={handleChange} 
            className={`rounded-lg shadow-sm ${errors.price ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
          />
          {errors.price && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.price}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="costPrice" className="text-sm font-medium text-slate-700">Cost Price ($)</Label>
          <Input 
            id="costPrice" 
            name="costPrice" 
            type="number" 
            min="0"
            step="0.01"
            value={formData.costPrice} 
            onChange={handleChange} 
            className={`rounded-lg shadow-sm ${errors.costPrice ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
          />
          {errors.costPrice && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.costPrice}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="stockQuantity" className="text-sm font-medium text-slate-700">Stock Quantity <span className="text-red-500">*</span></Label>
          <Input 
            id="stockQuantity" 
            name="stockQuantity" 
            type="number" 
            required 
            min="0"
            value={formData.stockQuantity} 
            onChange={handleChange} 
            className={`rounded-lg shadow-sm ${errors.stockQuantity ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
          />
          {errors.stockQuantity && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.stockQuantity}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="category" className="text-sm font-medium text-slate-700">Category <span className="text-red-500">*</span></Label>
          <Input 
            id="category" 
            name="category" 
            required 
            value={formData.category} 
            onChange={handleChange} 
            className={`rounded-lg shadow-sm ${errors.category ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
          />
          {errors.category && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.category}</p>}
        </div>
        
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="supplier" className="text-sm font-medium text-slate-700">Supplier</Label>
          <Input 
            id="supplier" 
            name="supplier" 
            value={formData.supplier} 
            onChange={handleChange} 
            className={`rounded-lg shadow-sm ${errors.supplier ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
          />
          {errors.supplier && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.supplier}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="sku" className="text-sm font-medium text-slate-700">SKU</Label>
          <Input 
            id="sku" 
            name="sku" 
            value={formData.sku} 
            onChange={handleChange} 
            className={`rounded-lg shadow-sm ${errors.sku ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
          />
          {errors.sku && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.sku}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="barcode" className="text-sm font-medium text-slate-700">Barcode</Label>
          <Input 
            id="barcode" 
            name="barcode" 
            value={formData.barcode} 
            onChange={handleChange} 
            className={`rounded-lg shadow-sm ${errors.barcode ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
          />
          {errors.barcode && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.barcode}</p>}
        </div>

        {/* Status */}
        <div className="col-span-2 flex items-center gap-2 mt-2">
          <input 
            type="checkbox" 
            id="isActive" 
            name="isActive" 
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active (Visible to customers)</Label>
        </div>

        {/* Image Upload Area */}
        <div className="col-span-2 border-t border-slate-100 pt-5 mt-2">
          <div className="mb-3 flex justify-between items-center">
            <Label className="text-base font-semibold text-slate-900">Product Images</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg shadow-sm"
            >
              <UploadCloud className="h-4 w-4 mr-2" />
              Upload Photos
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

          {/* Image Previews */}
          {(existingImages.length > 0 || newImagePreviews.length > 0) ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {/* Existing Images */}
              {existingImages.map((url, i) => (
                <div key={`existing-${i}`} className="relative group border rounded-lg overflow-hidden border-slate-200 bg-slate-50 aspect-square">
                  <img src={url} alt={`Existing product ${i}`} className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => removeExistingImage(url)}
                      className="h-8 w-8 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* New Selected Images */}
              {newImagePreviews.map((preview, i) => (
                <div key={`new-${i}`} className="relative group border border-blue-200 shadow-sm rounded-lg overflow-hidden bg-blue-50/30 aspect-square">
                  <div className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded z-10">New</div>
                  <img src={preview} alt={`New upload ${i}`} className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => removeNewImage(i)}
                      className="h-8 w-8 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-8 w-8 mb-3 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">Click to upload images</p>
              <p className="text-xs mt-1 text-slate-400">JPG, PNG, GIF up to 5MB</p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isSubmitting}
          className="rounded-lg shadow-sm border-slate-200 bg-white"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Saving...
            </span>
          ) : (
            isEditing ? "Save Changes" : "Create Product"
          )}
        </Button>
      </div>
    </form>
  );
}
