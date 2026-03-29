"use client";

import { useEffect, useState } from "react";
import { ProductDto } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Edit2, Trash2, PackageSearch, ImageOff } from "lucide-react";
import { ProductForm } from "../../../components/products/product-form";
import { getProxiedImageUrl } from "@/lib/imageProxy";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | undefined>(undefined);

  const fetchProducts = async (query = "") => {
    setIsLoading(true);
    try {
      const url = query ? `/api/products/search?name=${encodeURIComponent(query)}` : `/api/products`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Could not load products. Make sure API Gateway is running.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const handleOpenDialog = (product?: ProductDto) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      toast.success("Product deleted successfully!");
      fetchProducts(search);
    } catch (error) {
      console.error(error);
      toast.error("Could not delete product");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Products</h2>
          <p className="text-slate-500 mt-2">Manage your inventory, pricing, and product details.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all rounded-lg px-4 h-10">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/60 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Search products by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/50 border-slate-200/60 focus-visible:ring-blue-500 rounded-xl h-10 w-full"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-100">
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11 w-16">Image</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Product</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Category</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11 text-right">Price</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11 text-right">Stock</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider h-11 text-center">Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wider h-11">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-sm">Loading products...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <PackageSearch className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-900">No products found</p>
                      <p className="text-xs mt-1">Try adjusting your search query or add a new product.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.productId} className="hover:bg-slate-50/80 border-b-slate-50 transition-colors group">
                    {/* Image Column */}
                    <TableCell className="py-3">
                      <div className="h-12 w-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={getProxiedImageUrl(product.images[0])} 
                            alt={product.name} 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <ImageOff className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                    </TableCell>

                    {/* Product Column */}
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm truncate max-w-[200px]" title={product.name}>{product.name}</span>
                        <span className="text-xs text-slate-500 font-medium">ID: {product.productId}</span>
                        {product.sku && <span className="text-xs text-slate-400">SKU: {product.sku}</span>}
                      </div>
                    </TableCell>

                    {/* Category Column */}
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60">
                        {product.category}
                      </span>
                    </TableCell>

                    {/* Price Column */}
                    <TableCell className="text-right">
                      <span className="font-semibold text-slate-900">{formatCurrency(product.price)}</span>
                    </TableCell>

                    {/* Stock Column */}
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-semibold ${
                          product.stockQuantity <= 10 ? 'text-rose-600' : 'text-slate-900'
                        }`}>
                          {product.stockQuantity}
                        </span>
                        {product.stockQuantity <= 10 && (
                          <span className="text-[10px] text-rose-500 font-medium uppercase tracking-wider">Low Stock</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status Column */}
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border hidden sm:inline-flex ${
                        product.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                          : 'bg-slate-50 text-slate-500 border-slate-200/50'
                      }`}>
                        {product.isActive ? (
                          <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span> Active</>
                        ) : (
                          <><span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span> Inactive</>
                        )}
                      </span>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenDialog(product)}>
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteProduct(product.productId || "")}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl lg:max-w-4xl bg-white p-0 border-0 shadow-2xl rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              {editingProduct ? "Update the details for this product below." : "Fill in the information below to add a new product to your catalog."}
            </p>
          </div>
          
          <ProductForm 
            initialData={editingProduct} 
            onSuccess={() => { setIsDialogOpen(false); fetchProducts(search); }} 
            onCancel={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
