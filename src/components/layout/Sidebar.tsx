"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Target,
  Sparkles,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/ai-chat", label: "AI Assistant", icon: Sparkles, isAI: true },
];

export function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/30 flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-base leading-none">SpendSmart</span>
          <span className="block text-[10px] text-slate-500 mt-0.5">AI Expense Tracker</span>
        </div>
      </div>

      {/* Quick add button */}
      <div className="px-4 mb-4">
        <Link
          href="/expenses/new"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold",
            "bg-gradient-to-r from-brand-500 to-violet-600 text-white",
            "hover:from-brand-400 hover:to-violet-500 transition-all duration-200",
            "shadow-md shadow-brand-500/20"
          )}
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? item.isAI
                    ? "bg-gradient-to-r from-brand-500/20 to-violet-600/20 text-brand-300 border border-brand-500/30"
                    : "bg-white/8 text-white border border-white/8"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive
                    ? item.isAI
                      ? "text-brand-400"
                      : "text-white"
                    : "text-slate-500 group-hover:text-slate-300",
                  item.isAI && !isActive && "text-brand-500/60"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.isAI && (
                <span className="text-[9px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30 px-1.5 py-0.5 rounded-full">
                  AI
                </span>
              )}
              {isActive && (
                <ChevronRight className="w-3 h-3 text-slate-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {profile?.full_name ?? "User"}
            </div>
            <div className="text-xs text-slate-500 truncate">{profile?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            id="logout-btn"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-rose-400"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-white/5 bg-[#0d0f18]/60 backdrop-blur-xl h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile: top bar + drawer */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0d0f18]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm">SpendSmart</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/expenses/new"
            className="flex items-center gap-1 rounded-lg bg-brand-500/20 border border-brand-500/30 text-brand-400 px-3 py-1.5 text-xs font-semibold"
          >
            <Plus className="w-3 h-3" />
            Add
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white p-1"
            id="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-[#0d0f18] border-r border-white/5 animate-slide-in-right">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </aside>
        </>
      )}
    </>
  );
}
