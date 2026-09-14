import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_CONFIG, CATEGORIES } from "@/lib/constants";
import { Plus, Search, Filter, Receipt } from "lucide-react";
import Link from "next/link";
import type { Expense } from "@/types";
import { ExpenseActions } from "@/components/expenses/ExpenseActions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Expenses | SpendSmart" };

interface SearchParams {
  category?: string;
  search?: string;
  sort?: string;
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency_symbol")
    .eq("id", user.id)
    .single();

  const symbol = profile?.currency_symbol ?? "₹";

  let query = supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.category && params.category !== "All") {
    query = query.eq("category", params.category);
  }

  const { data: expenses } = await query.returns<Expense[]>();

  const filtered = params.search
    ? (expenses ?? []).filter(
        (e) =>
          e.description.toLowerCase().includes(params.search!.toLowerCase()) ||
          (e.merchant?.toLowerCase() ?? "").includes(params.search!.toLowerCase())
      )
    : (expenses ?? []);

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-slate-400 text-sm mt-1">
            {filtered.length} transactions · Total:{" "}
            <span className="text-white font-medium">{formatCurrency(total, symbol)}</span>
          </p>
        </div>
        <Link
          href="/expenses/new"
          id="add-expense-btn"
          className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-violet-600 hover:from-brand-400 hover:to-violet-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </Link>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4">
        <form className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Search expenses..."
              className="input-dark w-full rounded-xl pl-10 pr-4 py-2.5 text-sm"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              name="category"
              defaultValue={params.category ?? "All"}
              className="input-dark rounded-xl pl-10 pr-8 py-2.5 text-sm appearance-none cursor-pointer min-w-36"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_CONFIG[c].icon} {c}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-xl px-4 py-2.5 bg-white/5 border border-white/8 text-sm text-slate-300 hover:bg-white/10 transition-colors"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Expenses list */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <Receipt className="w-14 h-14 text-slate-700 mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No expenses found</h3>
          <p className="text-slate-600 text-sm mb-5">
            {params.search || params.category !== "All"
              ? "Try adjusting your filters"
              : "Start by adding your first expense"}
          </p>
          <Link
            href="/expenses/new"
            className="flex items-center gap-2 bg-brand-500/20 border border-brand-500/30 text-brand-400 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-brand-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </Link>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/5 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <div>Cat.</div>
            <div>Description</div>
            <div className="text-right">Amount</div>
            <div>Date</div>
            <div>Actions</div>
          </div>

          <div className="divide-y divide-white/4">
            {filtered.map((expense, i) => {
              const config = CATEGORY_CONFIG[expense.category];
              return (
                <div
                  key={expense.id}
                  className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto_auto] gap-2 sm:gap-4 items-center px-5 py-4 hover:bg-white/3 transition-colors group animate-fade-in"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  {/* Category icon */}
                  <div
                    className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-base flex-shrink-0"
                    style={{ background: config?.bg ?? "rgba(107,114,128,0.15)" }}
                  >
                    {config?.icon ?? "📦"}
                  </div>

                  {/* Description */}
                  <div className="flex items-center gap-3">
                    <div
                      className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: config?.bg ?? "rgba(107,114,128,0.15)" }}
                    >
                      {config?.icon ?? "📦"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-white truncate">
                        {expense.description}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        {expense.merchant && <span>{expense.merchant}</span>}
                        {expense.merchant && <span>·</span>}
                        <span
                          className="font-medium"
                          style={{ color: config?.color ?? "#6b7280" }}
                        >
                          {expense.category}
                        </span>
                        {expense.ai_categorized && (
                          <span className="text-[10px] bg-brand-500/15 text-brand-400 border border-brand-500/25 rounded px-1">
                            AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <div className="font-semibold text-white text-sm">
                      {formatCurrency(Number(expense.amount), symbol)}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-slate-500 hidden sm:block whitespace-nowrap">
                    {formatDate(expense.expense_date)}
                  </div>

                  {/* Actions */}
                  <ExpenseActions expenseId={expense.id} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
