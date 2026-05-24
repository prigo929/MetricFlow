"use client";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { orderSchema } from "@/lib/validations/schemas";
import type { OrderFormValues } from "@/lib/validations/schemas";
import { createOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatting";
import { Plus, Trash2 } from "lucide-react";
import type { Company, Product, UserProfile } from "@/types/database";

interface Props {
  companies: Pick<Company, "id" | "name">[];
  products:  Pick<Product, "id" | "name" | "sku" | "unit_price">[];
  users:     Pick<UserProfile, "id" | "full_name">[];
  currentUserId: string;
}

export function OrderForm({ companies, products, users, currentUserId }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema) as any,
    defaultValues: {
      status:     "draft",
      order_date: new Date().toISOString().split("T")[0],
      assigned_to: currentUserId,
      items: [{ product_id: "", quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  const orderTotal = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  }, 0);

  const onProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) setValue(`items.${index}.unit_price`, product.unit_price);
  };

  const onSubmit: SubmitHandler<OrderFormValues> = async (values) => {
    setServerError(null);
    const result = await createOrder(values);
    if (!result.success) { setServerError(result.error); return; }
    router.push(`/orders/${result.data.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Order header */}
      <Card>
        <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Select
            label="Company *"
            {...register("company_id")}
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select a company…"
            error={errors.company_id?.message}
          />
          <Select
            label="Assigned To *"
            {...register("assigned_to")}
            options={users.map((u) => ({ value: u.id, label: u.full_name }))}
            placeholder="Select rep…"
            error={errors.assigned_to?.message}
          />
          <Select
            label="Status"
            {...register("status")}
            options={[
              { value: "draft",      label: "Draft" },
              { value: "pending",    label: "Pending" },
              { value: "confirmed",  label: "Confirmed" },
            ]}
          />
          <Input label="Order Date *" type="date" {...register("order_date")} error={errors.order_date?.message} />
          <Input label="Expected Delivery" type="date" {...register("expected_delivery")} />
          <div className="col-span-2 space-y-1">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...register("notes")} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Optional notes…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button
              type="button" size="sm" variant="outline"
              onClick={() => append({ product_id: "", quantity: 1, unit_price: 0 })}
            >
              <Plus size={14} /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-5">
                <Select
                  label={index === 0 ? "Product" : undefined}
                  {...register(`items.${index}.product_id`)}
                  options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
                  placeholder="Select product…"
                  onChange={(e) => {
                    register(`items.${index}.product_id`).onChange(e);
                    onProductChange(index, e.target.value);
                  }}
                />
              </div>
              <div className="col-span-2">
                <Input label={index === 0 ? "Qty" : undefined} type="number" min={1}
                  {...register(`items.${index}.quantity`)} placeholder="1" />
              </div>
              <div className="col-span-3">
                <Input label={index === 0 ? "Unit Price (€)" : undefined} type="number" step="0.01"
                  {...register(`items.${index}.unit_price`)} placeholder="0.00" />
              </div>
              <div className="col-span-1 pb-1 text-right">
                <p className={`text-xs font-semibold text-gray-700 ${index === 0 ? "mt-5" : ""}`}>
                  {formatCurrency((Number(items[index]?.quantity) || 0) * (Number(items[index]?.unit_price) || 0))}
                </p>
              </div>
              <div className="col-span-1 pb-1">
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)}
                    className={`p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded ${index === 0 ? "mt-5" : ""}`}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {errors.items && (
            <p className="text-xs text-red-600">{errors.items.message ?? errors.items.root?.message}</p>
          )}

          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Order Total</p>
              <p className="text-2xl font-bold text-brand-600">{formatCurrency(orderTotal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{serverError}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Order…" : "Create Order"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
