"use client";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { companySchema } from "@/lib/validations/schemas";
import { createCompany, updateCompany } from "@/actions";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Company } from "@/types/database";

// Explicit form value type matching what the form fields produce
interface CompanyFormData {
  name: string;
  industry: string;
  country: string;
  city?: string;
  tier: "enterprise" | "mid_market" | "smb";
  annual_revenue?: string | number | null;
  employee_count?: string | number | null;
  website?: string;
  notes?: string;
}

const TIER_OPTIONS = [
  { value: "enterprise", label: "Enterprise" },
  { value: "mid_market", label: "Mid-Market" },
  { value: "smb",        label: "SMB" },
];

interface CompanyFormProps { company?: Company }

export function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(companySchema) as any,
    defaultValues: company
      ? {
          name:           company.name,
          industry:       company.industry,
          country:        company.country,
          city:           company.city ?? undefined,
          tier:           company.tier,
          annual_revenue: company.annual_revenue ?? undefined,
          employee_count: company.employee_count ?? undefined,
          website:        company.website ?? undefined,
          notes:          company.notes ?? undefined,
        }
      : { tier: "smb", country: "Romania" },
  });

  const onSubmit: SubmitHandler<CompanyFormData> = async (values) => {
    setServerError(null);
    const result = company
      ? await updateCompany(company.id, values)
      : await createCompany(values);

    if (!result.success) {
      setServerError(result.error);
      toast({
        title: "Error saving company",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: company ? "Company updated" : "Company created",
      description: company
        ? `${values.name} details have been saved.`
        : `${values.name} has been added successfully.`,
      variant: "success",
    });

    router.push("/companies");
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Company Name *" {...register("name")}
                error={errors.name?.message} placeholder="Acme Corp SRL" />
            </div>
            <Input label="Industry *" {...register("industry")}
              error={errors.industry?.message} placeholder="Technology" />
            <Input label="Country *" {...register("country")}
              error={errors.country?.message} placeholder="Romania" />
            <Input label="City" {...register("city")} placeholder="Bucharest" />
            <Select label="Tier *" {...register("tier")}
              options={TIER_OPTIONS} error={errors.tier?.message} />
            <Input label="Annual Revenue (€)" type="number"
              {...register("annual_revenue")} placeholder="1500000" />
            <Input label="Employee Count" type="number"
              {...register("employee_count")} placeholder="250" />
            <div className="col-span-2">
              <Input label="Website" {...register("website")}
                placeholder="https://company.com" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                {...register("notes")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Internal notes about this company…"
              />
            </div>
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : company ? "Update Company" : "Create Company"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
