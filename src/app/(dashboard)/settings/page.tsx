import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSelector } from "./RoleSelector";
import { AuditLogsList } from "./AuditLogsList";
import { ShieldAlert, History, Users } from "lucide-react";
import type { UserProfile } from "@/types";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await (supabase as any)
    .from("user_profiles").select("*").eq("id", user!.id).single();
  const profile = data as UserProfile | null;

  const initials = profile?.full_name
    ?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  let profiles: UserProfile[] = [];
  let logs: any[] = [];
  let migrationNeeded = false;

  if (profile?.role === "admin") {
    try {
      const pRes = await (supabase as any).from("user_profiles").select("*").order("full_name");
      const lRes = await (supabase as any).from("audit_logs").select("*, changed_by_user:user_profiles(full_name)").order("changed_at", { ascending: false }).limit(50);
      
      if (pRes.error || lRes.error) {
        migrationNeeded = true;
      } else {
        profiles = pRes.data || [];
        logs = lRes.data || [];
      }
    } catch {
      migrationNeeded = true;
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account, roles, and review audit history" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader><CardTitle>Profile Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 mb-4">
                {initials}
              </div>
              <p className="font-bold text-gray-900 text-lg">{profile?.full_name ?? "—"}</p>
              <p className="text-sm text-gray-500 mb-2">{profile?.email}</p>
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 capitalize">
                {profile?.role?.replace("_", " ")}
              </span>
            </div>
          </CardContent>
        </Card>

        {profile?.role === "admin" && (
          <div className="md:col-span-2 space-y-6">
            {migrationNeeded ? (
              <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-amber-800 flex items-center gap-2">
                    <ShieldAlert className="text-amber-600" /> Database Migration Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-700 space-y-2">
                  <p>
                    The audit log and role management tables are missing from your database.
                  </p>
                  <p className="font-semibold">
                    How to enable:
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open the file <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs text-amber-900">supabase/migrations/002_audit_logs_and_roles.sql</code>.</li>
                    <li>Copy its SQL contents.</li>
                    <li>Go to the <strong>SQL Editor</strong> on your Supabase Cloud Dashboard, paste the script, and click **Run**.</li>
                  </ol>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* User Role Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users size={18} className="text-brand-500" /> User Role Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-150">
                      {profiles.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-4 hover:bg-gray-50/20">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{p.full_name}</p>
                            <p className="text-xs text-gray-400">{p.email}</p>
                          </div>
                          <RoleSelector userId={p.id} currentRole={p.role} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Logs Trail */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History size={18} className="text-brand-500" /> Database Audit Logs (Recent 50 Changes)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {!logs.length ? (
                      <p className="text-sm text-gray-400 italic text-center py-6">No audit records found yet.</p>
                    ) : (
                      <AuditLogsList logs={logs} />
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
