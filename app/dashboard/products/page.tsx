"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Edit2, ImageOff, PackageSearch, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DashboardPageHeader,
  DashboardPageShell,
  EmptyState,
  MetricCard,
  SoftBadge,
  SurfacePanel,
  ToolbarRow,
} from "@/components/dashboard/ui";
import { ProductForm } from "@/components/products/product-form";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { ProductDto } from "@/types/models";
import { toast } from "sonner";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const lowStockCount = useMemo(
    () => products.filter((product) => product.stockQuantity <= 10).length,
    [products],
  );
  const activeCount = useMemo(() => products.filter((product) => product.isActive).length, [products]);

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Catalog Desk"
        title="Product management"
        description="Maintain your catalog, prices, product media, and stock levels inside a more polished retail admin view."
        actions={
          <Button
            onClick={() => handleOpenDialog()}
            className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add product
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Products" value={products.length} helper="Total catalog size" />
          <MetricCard label="Active listings" value={activeCount} helper="Visible items ready for sale" />
          <MetricCard label="Low stock" value={lowStockCount} helper="Products needing attention soon" />
        </div>
      </DashboardPageHeader>

      <SurfacePanel>
        <ToolbarRow>
          <form onSubmit={handleSearch} className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
            <Input
              type="text"
              placeholder="Search products by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-2xl border-black/10 bg-white pl-11 shadow-[0_8px_24px_rgba(15,23,42,0.04)] placeholder:text-black/35"
            />
          </form>
          <SoftBadge>{products.length} items</SoftBadge>
        </ToolbarRow>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-black/6 bg-black/[0.02] hover:bg-black/[0.02]">
                <TableHead className="h-12 w-20 px-6 text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Media
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Product
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Category
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Price
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Stock
                </TableHead>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Status
                </TableHead>
                <TableHead className="px-6 text-right text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-72 text-center text-black/55">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={<PackageSearch className="h-6 w-6" />}
                      title="No products found"
                      description="Try another search or create a new product in the catalog."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.productId} className="border-black/6 hover:bg-black/[0.02]">
                    <TableCell className="px-6 py-4">
                      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-black/8 bg-black/[0.03]">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={getProxiedImageUrl(product.images[0])}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <ImageOff className="h-5 w-5 text-black/25" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <p className="max-w-[260px] truncate font-semibold text-black" title={product.name}>
                          {product.name}
                        </p>
                        <p className="text-xs text-black/45">{product.productId}</p>
                        {product.sku ? <p className="text-xs text-black/38">SKU {product.sku}</p> : null}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-right font-semibold text-black">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <p className="font-semibold text-black">{product.stockQuantity}</p>
                      {product.stockQuantity <= 10 ? (
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
                          Low stock
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                          product.isActive
                            ? "border-black bg-black text-white"
                            : "border-black/10 bg-white text-black/55"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="rounded-xl border-black/10 bg-white hover:bg-black/[0.03]"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="rounded-xl border-black/10 bg-white hover:bg-black/[0.03]"
                          onClick={() => deleteProduct(product.productId || "")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SurfacePanel>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[32px] border border-black/8 bg-white p-0 shadow-[0_28px_100px_rgba(15,23,42,0.12)]">
          <div className="border-b border-black/6 bg-[linear-gradient(180deg,_#ffffff,_#f4f4f5)] px-6 py-6">
            <DialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-black">
              {editingProduct ? "Edit product" : "Add product"}
            </DialogTitle>
            <p className="mt-1 text-sm text-black/55">
              {editingProduct
                ? "Update catalog details, inventory values, and media."
                : "Create a new product card for the POS catalog."}
            </p>
          </div>

          <ProductForm
            initialData={editingProduct}
            onSuccess={() => {
              setIsDialogOpen(false);
              fetchProducts(search);
            }}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
