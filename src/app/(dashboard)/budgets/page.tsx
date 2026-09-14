import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { formatCurrency, getCurrentMonthRange } from "@/lib/utils";
import type { Budget, Expense } from "@/types";
import { BudgetManager } from "@/components/budgets/BudgetManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Budgets | SpendSmart" };

export default async function BudgetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency_symbol")
    .eq("id", user.id)
    .single();

  const symbol = profile?.currency_symbol ?? "₹";
  const { start, end } = getCurrentMonthRange();

  const [{ data: budgets }, { data: thisMonthExpenses }] = await Promise.all([
    supabase.from("budgets").select("*").eq("user_id", user.id).returns<Budget[]>(),
    supabase
      .from("expenses")
      .select("amount, category")
      .eq("user_id", user.id)
      .gte("expense_date", start)
      .lte("expense_date", end)
      .returns<Partial<Expense>[]>(),
  ]);

  const categoryActuals: Record<string, number> = {};
  (thisMonthExpenses ?? []).forEach((e) => {
    if (e.category && e.amount) {
      categoryActuals[e.category] =
        (categoryActuals[e.category] ?? 0) + Number(e.amount);
    }
  });

  const budgetSummaries = (budgets ?? []).map((b) => {
    const actual = categoryActuals[b.category] ?? 0;
    const pct = Math.min((actual / Number(b.monthly_limit)) * 100, 100);
    return {
      ...b,
      actual,
      percentage: pct,
      status:
        pct >= 100
          ? ("over" as const)
          : pct >= 80
          ? ("warning" as const)
          : ("ok" as const),
      remaining: Math.max(Number(b.monthly_limit) - actual, 0),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Budget Manager</h1>
        <p className="text-slate-400 text-sm mt-1">
          Set monthly limits per category and track your progress
        </p>
      </div>

      <BudgetManager
        budgetSummaries={budgetSummaries}
        symbol={symbol}
        userId={user.id}
      />
    </div>
  );
}
