import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import type { UserProfile } from "@/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as UserProfile | null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar userRole={profile?.role ?? "viewer"} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar user={profile} />
        <main className="flex-1 overflow-y-auto p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
