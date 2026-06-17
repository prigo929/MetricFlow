"use client";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { companySchema, type CompanyFormValues } from "@/lib/validations/schemas";
import { createCompany, updateCompany } from "@/actions";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Company } from "@/types";

const TIER_OPTIONS = [
  { value: "enterprise", label: "Enterprise" },
  { value: "mid_market", label: "Mid-Market" },
  { value: "smb",        label: "SMB" },
];

interface CompanyFormProps { 
  // If `company` is passed, the form acts in EDIT mode. Otherwise, it acts in CREATE mode.
  company?: Company 
}

export function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter();
  // State to capture and display database-level mutation errors returned by the server
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    // `isSubmitting` is handled automatically by react-hook-form during async onSubmit execution
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema) as any,
    // If we have an existing company (EDIT mode), prefill form values.
    // Otherwise (CREATE mode), initialize defaults (e.g. SMB tier in Romania).
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

  const onSubmit: SubmitHandler<CompanyFormValues> = async (values) => {
    setServerError(null);
    
    // Choose which Server Action to invoke based on whether we are editing or creating
    const result = company
      ? await updateCompany(company.id, values)
      : await createCompany(values);

    // If server action fails, notify user and render message
    if (!result.success) {
      setServerError(result.error);
      toast({
        title: "Error saving company",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
      return;
    }

    // If successful, render notification toaster card
    toast({
      title: company ? "Company updated" : "Company created",
      description: company
        ? `${values.name} details have been saved.`
        : `${values.name} has been added successfully.`,
      variant: "success",
    });

    // Send user back to companies grid list and tell Next.js to refresh layout state
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

