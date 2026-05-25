"use client";

import { useState } from "react";
import { updateUserRole } from "@/actions/users";
import { toast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  currentRole: string;
}

export function RoleSelector({ userId, currentRole }: Props) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setLoading(true);
    setError(null);
    try {
      const res = await updateUserRole(userId, newRole);
      if (!res.success) {
        const errMsg = res.error || "Failed to update role";
        setError(errMsg);
        setRole(currentRole); // Revert UI
        toast({
          title: "Role update failed",
          description: errMsg,
          variant: "destructive",
        });
      } else {
        setRole(newRole);
        toast({
          title: "User role updated",
          description: `User role has been successfully changed to "${newRole}".`,
          variant: "success",
        });
      }
    } catch (err: any) {
      const errMsg = err.message || "An error occurred";
      setError(errMsg);
      setRole(currentRole); // Revert UI
      toast({
        title: "Error updating role",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 items-end">
      <select
        value={role}
        onChange={handleChange}
        disabled={loading}
        className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-60 font-medium text-gray-700"
      >
        <option value="admin">Admin</option>
        <option value="sales_rep">Sales Rep</option>
        <option value="viewer">Viewer</option>
      </select>
      {error && <span className="text-[10px] text-red-600 font-medium">{error}</span>}
    </div>
  );
}
