import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, formatRelativeDate, getCurrentMonthRange, getLastMonthRange } from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { TrendingUp, TrendingDown, ArrowUpRight, Sparkles, Receipt, Wallet, PieChart } from "lucide-react";
import Link from "next/link";
import type { Expense, Budget, AiInsight } from "@/types";
import { MiniDonutChart } from "@/components/dashboard/MiniDonutChart";
import { AiInsightsCard } from "@/components/dashboard/AiInsightsCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
  const { start: lastMonthStart, end: lastMonthEnd } = getLastMonthRange();

  // Fetch data in parallel
  const [
    { data: thisMonthExpenses },
    { data: lastMonthExpenses },
    { data: recentExpenses },
    { data: budgets },
    { data: insights },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("amount, category")
      .eq("user_id", user.id)
      .gte("expense_date", monthStart)
      .lte("expense_date", monthEnd),
    supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .gte("expense_date", lastMonthStart)
      .lte("expense_date", lastMonthEnd),
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("expense_date", { ascending: false })
      .limit(6),
    supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id),
    supabase
      .from("ai_insights")
      .select("*")
      .eq("user_id", user.id)
      .eq("dismissed", false)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("profiles")
      .select("full_name, currency_symbol")
      .eq("id", user.id)
      .single(),
  ]);

  const symbol = profile?.currency_symbol ?? "₹";
  const thisMonthTotal = (thisMonthExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const lastMonthTotal = (lastMonthExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const monthChange = lastMonthTotal > 0
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    : 0;

  // Category breakdown for donut chart
  const categoryTotals: Record<string, number> = {};
  (thisMonthExpenses ?? []).forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + Number(e.amount);
  });
  const chartData = Object.entries(categoryTotals)
    .map(([category, total]) => ({
      category,
      total,
      color: CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.color ?? "#6b7280",
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const totalBudget = (budgets ?? []).reduce((s, b) => s + Number(b.monthly_limit), 0);
  const budgetUsed = totalBudget > 0
    ? Math.min((thisMonthTotal / totalBudget) * 100, 100)
    : 0;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stats = [
    {
      label: "Spent This Month",
      value: formatCurrency(thisMonthTotal, symbol),
      sub: `${monthChange >= 0 ? "+" : ""}${monthChange.toFixed(1)}% vs last month`,
      trend: monthChange,
      icon: Wallet,
      color: "from-brand-500 to-violet-600",
      glow: "shadow-brand-500/20",
    },
    {
      label: "Last Month",
      value: formatCurrency(lastMonthTotal, symbol),
      sub: `${(lastMonthExpenses ?? []).length} transactions`,
      trend: null,
      icon: Receipt,
      color: "from-slate-600 to-slate-700",
      glow: "shadow-slate-500/10",
    },
    {
      label: "Budget Remaining",
      value: formatCurrency(Math.max(totalBudget - thisMonthTotal, 0), symbol),
      sub: `${budgetUsed.toFixed(0)}% of budget used`,
      trend: null,
      icon: PieChart,
      color: budgetUsed > 90 ? "from-rose-500 to-pink-600" : "from-emerald-500 to-teal-600",
      glow: budgetUsed > 90 ? "shadow-rose-500/20" : "shadow-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here&apos;s your financial overview for{" "}
            {new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Link
          href="/expenses/new"
          className="hidden md:flex items-center gap-2 bg-gradient-to-r from-brand-500 to-violet-600 hover:from-brand-400 hover:to-violet-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-lg shadow-brand-500/20"
        >
          + Add Expense
        </Link>
      </div>

      {/* AI Insights */}
      {(insights ?? []).length > 0 && (
        <AiInsightsCard insights={insights as AiInsight[]} userId={user.id} />
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="glass rounded-2xl p-5 card-hover animate-slide-up"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.glow}`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              {stat.trend !== null && (
                <div
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trend >= 0
                      ? "bg-rose-500/10 text-rose-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {stat.trend >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(stat.trend).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
            <div className="text-xs text-slate-600 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent expenses */}
        <div className="lg:col-span-3 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Expenses</h2>
            <Link
              href="/expenses"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {(recentExpenses ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Receipt className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No expenses yet</p>
              <Link
                href="/expenses/new"
                className="mt-3 text-xs text-brand-400 hover:underline"
              >
                Add your first expense →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(recentExpenses as Expense[]).map((expense, i) => {
                const config = CATEGORY_CONFIG[expense.category];
                return (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/4 transition-colors group animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: config?.bg ?? "rgba(107,114,128,0.15)" }}
                    >
                      {config?.icon ?? "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {expense.description}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {expense.merchant && `${expense.merchant} · `}
                        {formatRelativeDate(expense.expense_date)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-white">
                        {formatCurrency(expense.amount, symbol)}
                      </div>
                      <div
                        className="text-[10px] mt-0.5 font-medium"
                        style={{ color: config?.color ?? "#6b7280" }}
                      >
                        {expense.category}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category donut */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">This Month</h2>
            <Link
              href="/analytics"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              Analytics <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <PieChart className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No data yet</p>
            </div>
          ) : (
            <>
              <MiniDonutChart data={chartData} total={thisMonthTotal} symbol={symbol} />
              <div className="space-y-2 mt-4">
                {chartData.map((item) => (
                  <div key={item.category} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    <span className="text-xs text-slate-400 flex-1 truncate">
                      {item.category}
                    </span>
                    <span className="text-xs font-medium text-white">
                      {formatCurrency(item.total, symbol)}
                    </span>
                    <span className="text-xs text-slate-600 w-8 text-right">
                      {thisMonthTotal > 0
                        ? `${((item.total / thisMonthTotal) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Chat prompt */}
      <Link
        href="/ai-chat"
        className="flex items-center gap-4 glass rounded-2xl p-5 hover:border-brand-500/30 transition-all duration-300 card-hover group border border-transparent"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/30 flex-shrink-0 animate-bounce-subtle">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors">
            Ask AI about your finances
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            &quot;How much did I spend on food this month?&quot; — Try it →
          </p>
        </div>
        <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-brand-400 transition-colors" />
      </Link>
    </div>
  );
}
