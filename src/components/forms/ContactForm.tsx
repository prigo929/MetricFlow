"use client";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { contactSchema } from "@/lib/validations/schemas";
import type { ContactFormValues } from "@/lib/validations/schemas";
import { createContact, updateContact } from "@/actions/contacts";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Contact, Company } from "@/types/database";

interface Props {
  contact?: Contact;
  companies: Pick<Company, "id" | "name">[];
  defaultCompanyId?: string;
}

export function ContactForm({ contact, companies, defaultCompanyId }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema) as any,
    defaultValues: contact
      ? { company_id: contact.company_id, full_name: contact.full_name, email: contact.email, phone: contact.phone ?? undefined, job_title: contact.job_title ?? undefined, is_primary: contact.is_primary }
      : { company_id: defaultCompanyId ?? "", is_primary: false },
  });

  const onSubmit: SubmitHandler<ContactFormValues> = async (values) => {
    setServerError(null);
    const result = contact ? await updateContact(contact.id, values) : await createContact(values);
    if (!result.success) { setServerError(result.error); return; }
    router.back();
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Select label="Company *" {...register("company_id")}
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select company…" error={errors.company_id?.message} />
            </div>
            <Input label="Full Name *" {...register("full_name")} error={errors.full_name?.message} placeholder="Ion Popescu" />
            <Input label="Email *" type="email" {...register("email")} error={errors.email?.message} placeholder="ion@company.ro" />
            <Input label="Phone" {...register("phone")} placeholder="+40 721 000 000" />
            <Input label="Job Title" {...register("job_title")} placeholder="Procurement Manager" />
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="is_primary" {...register("is_primary")} className="w-4 h-4 accent-brand-500 rounded" />
              <label htmlFor="is_primary" className="text-sm font-medium text-gray-700">Primary contact for this company</label>
            </div>
          </div>
          {serverError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{serverError}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : contact ? "Update Contact" : "Create Contact"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
