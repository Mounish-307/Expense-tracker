import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CATEGORY_CONFIG, CHART_COLORS } from "@/lib/constants";
import { formatCurrency, getMonthName } from "@/lib/utils";
import type { Expense, Budget } from "@/types";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics | SpendSmart" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency_symbol")
    .eq("id", user.id)
    .single();

  const symbol = profile?.currency_symbol ?? "₹";

  // Get last 6 months of expenses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [{ data: expenses }, { data: budgets }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .gte("expense_date", sixMonthsAgo.toISOString().split("T")[0])
      .returns<Expense[]>(),
    supabase.from("budgets").select("*").eq("user_id", user.id).returns<Budget[]>(),
  ]);

  // Build monthly data
  const monthlyMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = 0;
  }

  (expenses ?? []).forEach((e) => {
    const key = e.expense_date.substring(0, 7);
    if (key in monthlyMap) monthlyMap[key] = (monthlyMap[key] ?? 0) + Number(e.amount);
  });

  const monthlyData = Object.entries(monthlyMap).map(([key, total]) => {
    const [year, month] = key.split("-");
    return {
      month: getMonthName(parseInt(month) - 1),
      total: Math.round(total),
      budget: (budgets ?? []).reduce((s, b) => s + Number(b.monthly_limit), 0),
    };
  });

  // This month category breakdown
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const thisMonthExpenses = (expenses ?? []).filter(
    (e) => e.expense_date >= monthStart
  );
  const thisMonthTotal = thisMonthExpenses.reduce(
    (s, e) => s + Number(e.amount),
    0
  );

  const categoryMap: Record<string, number> = {};
  thisMonthExpenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + Number(e.amount);
  });

  const categoryData = Object.entries(categoryMap)
    .map(([category, value], i) => ({
      category,
      value: Math.round(value),
      percentage:
        thisMonthTotal > 0
          ? Math.round((value / thisMonthTotal) * 100)
          : 0,
      color:
        CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.color ??
        CHART_COLORS[i % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  // Daily spending for current month
  const dailyMap: Record<string, number> = {};
  thisMonthExpenses.forEach((e) => {
    dailyMap[e.expense_date] =
      (dailyMap[e.expense_date] ?? 0) + Number(e.amount);
  });

  const dailyData = Object.entries(dailyMap)
    .map(([date, amount]) => ({
      date: new Date(date).getDate(),
      amount: Math.round(amount),
    }))
    .sort((a, b) => a.date - b.date);

  // Budget vs actual (this month)
  const budgetData = (budgets ?? []).map((b) => {
    const actual = categoryMap[b.category] ?? 0;
    return {
      category: b.category,
      budget: Number(b.monthly_limit),
      actual: Math.round(actual),
      icon: CATEGORY_CONFIG[b.category as keyof typeof CATEGORY_CONFIG]?.icon ?? "📦",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">
          Spending patterns across the last 6 months
        </p>
      </div>

      <AnalyticsCharts
        monthlyData={monthlyData}
        categoryData={categoryData}
        dailyData={dailyData}
        budgetData={budgetData}
        symbol={symbol}
      />
    </div>
  );
}
