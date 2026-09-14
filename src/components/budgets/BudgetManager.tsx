"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants";
import { formatCurrency, cn } from "@/lib/utils";
import type { Budget, ExpenseCategory } from "@/types";

interface BudgetSummary extends Budget {
  actual: number;
  percentage: number;
  status: "ok" | "warning" | "over";
  remaining: number;
}

interface Props {
  budgetSummaries: BudgetSummary[];
  symbol: string;
  userId: string;
}

const STATUS_CONFIG = {
  ok: {
    icon: CheckCircle,
    color: "text-emerald-400",
    label: "On track",
    barGrad: "from-emerald-500 to-teal-500",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    label: "Nearing limit",
    barGrad: "from-amber-500 to-orange-500",
  },
  over: {
    icon: XCircle,
    color: "text-rose-400",
    label: "Over budget",
    barGrad: "from-rose-500 to-pink-500",
  },
};

export function BudgetManager({ budgetSummaries, symbol, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<ExpenseCategory>("Food");
  const [formLimit, setFormLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const usedCategories = budgetSummaries.map((b) => b.category);
  const availableCategories = CATEGORIES.filter(
    (c) => !usedCategories.includes(c) || c === formCategory
  );

  async function handleSave() {
    if (!formLimit || isNaN(parseFloat(formLimit))) return;
    setSaving(true);

    if (editId) {
      await supabase
        .from("budgets")
        .update({ monthly_limit: parseFloat(formLimit) })
        .eq("id", editId)
        .eq("user_id", userId);
    } else {
      await supabase.from("budgets").upsert({
        user_id: userId,
        category: formCategory,
        monthly_limit: parseFloat(formLimit),
      });
    }

    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setFormLimit("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this budget?")) return;
    setDeletingId(id);
    await supabase.from("budgets").delete().eq("id", id).eq("user_id", userId);
    setDeletingId(null);
    router.refresh();
  }

  async function getAiRecommendations() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/budget-recommend", { method: "POST" });
      const data = await res.json();
      if (data.recommendations) {
        // Store as insights
        const insightRows = data.recommendations.map((r: { category: string; recommended: number; reason: string }) => ({
          user_id: userId,
          type: "recommendation",
          title: `Budget tip for ${r.category}`,
          content: `${r.reason} Recommended: ${symbol}${r.recommended.toLocaleString("en-IN")}/month`,
          category: r.category,
        }));
        await supabase.from("ai_insights").insert(insightRows);
        router.refresh();
      }
    } catch {
      // Fail silently
    } finally {
      setAiLoading(false);
    }
  }

  const totalBudget = budgetSummaries.reduce((s, b) => s + Number(b.monthly_limit), 0);
  const totalActual = budgetSummaries.reduce((s, b) => s + b.actual, 0);

  return (
    <div className="space-y-5">
      {/* Summary card */}
      {budgetSummaries.length > 0 && (
        <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1">
            <div className="text-sm text-slate-400 mb-2">Total Monthly Budget</div>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-white">
                {formatCurrency(totalActual, symbol)}
              </span>
              <span className="text-slate-500 text-sm mb-1">
                / {formatCurrency(totalBudget, symbol)}
              </span>
            </div>
            <div className="mt-3 h-2.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-brand-500 to-violet-600"
                style={{
                  width: `${Math.min((totalActual / totalBudget) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={getAiRecommendations}
              disabled={aiLoading}
              id="ai-budget-btn"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium hover:bg-brand-500/20 transition-colors disabled:opacity-50"
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI Recommend
            </button>
            {availableCategories.length > 0 && (
              <button
                onClick={() => { setShowForm(true); setEditId(null); setFormCategory(availableCategories[0]); setFormLimit(""); }}
                id="add-budget-btn"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-brand-500/20"
              >
                <Plus className="w-4 h-4" />
                Add Budget
              </button>
            )}
          </div>
        </div>
      )}

      {/* Budget form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 border border-brand-500/20 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">
              {editId ? "Edit Budget" : "New Budget"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
              disabled={!!editId}
              className="input-dark rounded-xl px-4 py-3 text-sm flex-1 disabled:opacity-50"
            >
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_CONFIG[c].icon} {c}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
              <input
                type="number"
                value={formLimit}
                onChange={(e) => setFormLimit(e.target.value)}
                placeholder="Monthly limit"
                min="1"
                className="input-dark w-full rounded-xl pl-7 pr-4 py-3 text-sm"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !formLimit}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-brand-500/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {budgetSummaries.length === 0 ? (
        <div className="glass rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <Target className="w-14 h-14 text-slate-700 mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No budgets set</h3>
          <p className="text-slate-600 text-sm mb-5">
            Set monthly limits to track your spending goals
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-brand-500/20 border border-brand-500/30 text-brand-400 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-brand-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add your first budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgetSummaries.map((b, i) => {
            const config = CATEGORY_CONFIG[b.category as keyof typeof CATEGORY_CONFIG];
            const statusConfig = STATUS_CONFIG[b.status];
            return (
              <div
                key={b.id}
                className="glass rounded-2xl p-5 card-hover animate-slide-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: config?.bg }}
                    >
                      {config?.icon ?? "📦"}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{b.category}</div>
                      <div className={cn("text-xs flex items-center gap-1 mt-0.5", statusConfig.color)}>
                        <statusConfig.icon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditId(b.id);
                        setFormCategory(b.category as ExpenseCategory);
                        setFormLimit(String(b.monthly_limit));
                        setShowForm(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deletingId === b.id}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    >
                      {deletingId === b.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Used</span>
                    <span className="font-medium text-white">{b.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${statusConfig.barGrad}`}
                      style={{ width: `${b.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-xs">
                  <div>
                    <div className="text-slate-500">Spent</div>
                    <div className="font-semibold text-white mt-0.5">
                      {formatCurrency(b.actual, symbol)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500">Remaining</div>
                    <div
                      className={cn(
                        "font-semibold mt-0.5",
                        b.status === "over" ? "text-rose-400" : "text-emerald-400"
                      )}
                    >
                      {b.status === "over"
                        ? `−${formatCurrency(b.actual - Number(b.monthly_limit), symbol)}`
                        : formatCurrency(b.remaining, symbol)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500">Budget</div>
                    <div className="font-semibold text-slate-300 mt-0.5">
                      {formatCurrency(Number(b.monthly_limit), symbol)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add budget card */}
          {availableCategories.length > 0 && (
            <button
              onClick={() => { setShowForm(true); setEditId(null); setFormCategory(availableCategories[0]); setFormLimit(""); }}
              className="glass rounded-2xl p-5 border-2 border-dashed border-white/8 hover:border-brand-500/30 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-brand-400 transition-all group min-h-40"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-brand-500/10 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Add Budget</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
