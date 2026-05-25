"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AuditLog {
  id: string;
  table_name: string;
  action: string;
  record_id: string;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changed_by: string | null;
  changed_at: string;
  changed_by_user?: { full_name: string } | null;
}

export function AuditLogsList({ logs }: { logs: AuditLog[] }) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "INSERT":
        return "bg-green-50 text-green-700 border-green-200";
      case "UPDATE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "DELETE":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const renderDiff = (log: AuditLog) => {
    const oldD = log.old_data || {};
    const newD = log.new_data || {};

    if (log.action === "INSERT") {
      return (
        <div className="space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-150">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Created Record Values:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {Object.entries(newD).map(([key, val]) => (
              val !== null && val !== "" && (
                <div key={key} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                  <span className="font-mono text-gray-400">{key}</span>
                  <span className="font-medium text-gray-700 truncate max-w-[150px]">{String(val)}</span>
                </div>
              )
            ))}
          </div>
        </div>
      );
    }

    if (log.action === "DELETE") {
      return (
        <div className="space-y-1 bg-red-50/20 p-3 rounded-lg border border-red-100">
          <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">Deleted Record Snapshot:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-red-950">
            {Object.entries(oldD).map(([key, val]) => (
              val !== null && val !== "" && (
                <div key={key} className="flex justify-between py-1 border-b border-red-50 last:border-0">
                  <span className="font-mono text-red-400">{key}</span>
                  <span className="font-medium truncate max-w-[150px]">{String(val)}</span>
                </div>
              )
            ))}
          </div>
        </div>
      );
    }

    if (log.action === "UPDATE") {
      const diffKeys = Object.keys({ ...oldD, ...newD }).filter((k) => {
        if (["updated_at", "created_at"].includes(k)) return false;
        return JSON.stringify(oldD[k]) !== JSON.stringify(newD[k]);
      });

      if (diffKeys.length === 0) {
        return <p className="text-xs text-gray-400 italic">Only timestamp updates detected.</p>;
      }

      return (
        <div className="space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-150">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Modified Fields:</p>
          <div className="space-y-1.5 text-xs">
            {diffKeys.map((key) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-gray-100 last:border-0 gap-1">
                <span className="font-mono text-gray-500 font-semibold">{key}</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-red-600 line-through bg-red-50/50 px-1.5 py-0.5 rounded truncate max-w-[150px]">{String(oldD[key] ?? "—")}</span>
                  <span className="text-gray-400 font-normal">→</span>
                  <span className="text-green-700 bg-green-50 px-1.5 py-0.5 rounded truncate max-w-[150px]">{String(newD[key] ?? "—")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white max-h-[500px] overflow-y-auto">
      {logs.map((log) => {
        const isExpanded = expandedLogId === log.id;
        const timeAgo = formatDistanceToNow(new Date(log.changed_at), { addSuffix: true });
        const name = log.changed_by_user?.full_name || "System Admin (Direct SQL)";

        return (
          <div key={log.id} className="p-3.5 flex flex-col gap-2 hover:bg-gray-50/30 transition-colors">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded border ${getActionColor(log.action)}`}>
                  {log.action}
                </span>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  {log.table_name}
                </span>
                <span className="text-[10px] text-gray-400 truncate max-w-[150px] hidden sm:inline font-mono">
                  ({log.record_id})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-800">{name}</p>
                  <p className="text-[10px] text-gray-400">{timeAgo}</p>
                </div>
                {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </div>
            </div>
            {isExpanded && (
              <div className="mt-1">
                {renderDiff(log)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
