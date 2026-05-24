"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, Package,
  ShoppingCart, BarChart3, FileText, Settings, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/companies",  label: "Companies",  icon: Building2 },
  { href: "/contacts",   label: "Contacts",   icon: Users },
  { href: "/products",   label: "Products",   icon: Package },
  { href: "/orders",     label: "Orders",     icon: ShoppingCart },
  { href: "/analytics",  label: "Analytics",  icon: BarChart3 },
  { href: "/reports",    label: "Reports",    icon: FileText },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col"
      style={{ background: "hsl(var(--sidebar-bg))" }}>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">MetricFlow</span>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-5 pt-4 pb-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 uppercase tracking-wider">
          {userRole.replace("_", " ")}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}>
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t pt-3"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
