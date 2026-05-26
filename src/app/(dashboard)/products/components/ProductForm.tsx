"use client";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { productSchema } from "@/lib/validations/schemas";
import type { ProductFormValues } from "@/lib/validations/schemas";
import { createProduct, updateProduct } from "@/actions";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/types/database";

const CATEGORY_OPTIONS = [
  { value: "software",    label: "Software" },
  { value: "hardware",    label: "Hardware" },
  { value: "services",    label: "Services" },
  { value: "consulting",  label: "Consulting" },
  { value: "support",     label: "Support" },
];

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: product
      ? {
          name:        product.name,
          sku:         product.sku,
          category:    product.category,
          description: product.description ?? undefined,
          unit_price:  product.unit_price,
          stock_qty:   product.stock_qty,
          is_active:   product.is_active,
        }
      : { is_active: true, stock_qty: 0 },
  });

  const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
    setServerError(null);
    const result = product
      ? await updateProduct(product.id, values)
      : await createProduct(values);
    if (!result.success) {
      setServerError(result.error);
      toast({
        title: "Error saving product",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: product ? "Product updated" : "Product created",
      description: product
        ? `${values.name} details have been saved.`
        : `${values.name} has been added successfully.`,
      variant: "success",
    });

    router.push("/products");
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Product Name *" {...register("name")} error={errors.name?.message} placeholder="ERP Suite Pro" />
            </div>
            <Input label="SKU *" {...register("sku")} error={errors.sku?.message} placeholder="SW-001" />
            <Select label="Category *" {...register("category")} options={CATEGORY_OPTIONS} error={errors.category?.message} />
            <Input label="Unit Price (€) *" type="number" step="0.01" {...register("unit_price")} error={errors.unit_price?.message} placeholder="4999" />
            <Input label="Stock Quantity" type="number" {...register("stock_qty")} placeholder="100" />
            <div className="col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea {...register("description")} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Optional product description…" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="is_active" {...register("is_active")}
                className="w-4 h-4 accent-brand-500 rounded" />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active (visible in orders)</label>
            </div>
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{serverError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : product ? "Update Product" : "Create Product"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
