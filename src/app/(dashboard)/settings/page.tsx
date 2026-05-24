import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile } from "@/types/database";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await (supabase as any)
    .from("user_profiles").select("*").eq("id", user!.id).single();
  const profile = data as UserProfile | null;

  const initials = profile?.full_name
    ?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">{profile?.full_name ?? "—"}</p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 capitalize">
                {profile?.role?.replace("_", " ")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
