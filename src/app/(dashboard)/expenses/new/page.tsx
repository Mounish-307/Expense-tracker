"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Upload,
  X,
  Loader2,
  CheckCircle,
  Camera,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants";
import { cn, fileToBase64 } from "@/lib/utils";
import type { ExpenseCategory, ExpenseFormData } from "@/types";

const DEFAULT_FORM: ExpenseFormData = {
  amount: "",
  category: "Other",
  description: "",
  merchant: "",
  expense_date: new Date().toISOString().split("T")[0],
  notes: "",
  receipt_file: null,
};

export default function NewExpensePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ExpenseFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [aiCategorized, setAiCategorized] = useState(false);

  function updateField<K extends keyof ExpenseFormData>(
    key: K,
    value: ExpenseFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setAiSuccess(false);
  }

  async function handleAiCategorize() {
    if (!form.description.trim()) return;
    setAiLoading(true);
    setAiSuccess(false);

    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: form.description, merchant: form.merchant }),
      });
      const data = await res.json();
      if (data.category) {
        setForm((prev) => ({ ...prev, category: data.category }));
        setAiCategorized(true);
        setAiSuccess(true);
        setTimeout(() => setAiSuccess(false), 2500);
      }
    } catch {
      setError("AI categorization failed. Please select manually.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleReceiptUpload(file: File) {
    if (!file) return;
    setReceiptLoading(true);

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setReceiptPreview(previewUrl);
    setForm((prev) => ({ ...prev, receipt_file: file }));

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/ai/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mimeType: file.type,
        }),
      });
      const data = await res.json();

      if (data.amount) setForm((prev) => ({ ...prev, amount: String(data.amount) }));
      if (data.merchant) setForm((prev) => ({ ...prev, merchant: data.merchant }));
      if (data.description) setForm((prev) => ({ ...prev, description: data.description }));
      if (data.category) setForm((prev) => ({ ...prev, category: data.category }));
      if (data.date) setForm((prev) => ({ ...prev, expense_date: data.date }));
      setAiCategorized(true);
    } catch {
      // Receipt OCR failed — keep the preview but don't pre-fill
    } finally {
      setReceiptLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || isNaN(parseFloat(form.amount))) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let receipt_url: string | null = null;

    // Upload receipt if provided
    if (form.receipt_file) {
      const ext = form.receipt_file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, form.receipt_file);

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from("receipts")
          .getPublicUrl(uploadData.path);
        receipt_url = urlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from("expenses").insert({
      user_id: user.id,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description.trim(),
      merchant: form.merchant.trim() || null,
      expense_date: form.expense_date,
      notes: form.notes.trim() || null,
      receipt_url,
      ai_categorized: aiCategorized,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.push("/expenses");
      router.refresh();
    }
  }

  const selectedConfig = CATEGORY_CONFIG[form.category];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/expenses"
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Add Expense</h1>
          <p className="text-slate-500 text-sm">Use AI to auto-fill details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Receipt upload */}
        <div
          className={cn(
            "glass rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all",
            receiptPreview
              ? "border-brand-500/40"
              : "border-white/10 hover:border-brand-500/30"
          )}
          onClick={() => !receiptPreview && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleReceiptUpload(file);
            }}
          />

          {receiptLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <div className="text-sm text-slate-400">
                AI is reading your receipt...
              </div>
            </div>
          ) : receiptPreview ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receiptPreview}
                alt="Receipt preview"
                className="w-16 h-16 object-cover rounded-xl border border-white/10"
              />
              <div className="text-left flex-1">
                <div className="text-sm font-medium text-white">Receipt uploaded</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3 h-3" />
                  AI extracted details
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReceiptPreview(null);
                  setForm((prev) => ({ ...prev, receipt_file: null }));
                }}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <Camera className="w-6 h-6 text-brand-400" />
              </div>
              <div className="text-sm font-medium text-slate-300">
                Upload receipt for AI auto-fill
              </div>
              <div className="text-xs text-slate-600">
                JPG, PNG, WEBP or PDF · Max 5MB
              </div>
            </div>
          )}
        </div>

        {/* Main form card */}
        <div className="glass rounded-2xl p-6 space-y-5">
          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="amount">
              Amount (₹) *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                placeholder="0.00"
                required
                className="input-dark w-full rounded-xl pl-10 pr-4 py-3 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Description + AI button */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="description">
              Description *
            </label>
            <div className="flex gap-2">
              <input
                id="description"
                type="text"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="e.g. Dinner at restaurant"
                required
                className="input-dark flex-1 rounded-xl px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={handleAiCategorize}
                disabled={!form.description.trim() || aiLoading}
                id="ai-categorize-btn"
                title="AI categorize"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap",
                  aiSuccess
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    : "bg-brand-500/10 border-brand-500/20 text-brand-400 hover:bg-brand-500/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {aiLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : aiSuccess ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {aiSuccess ? "Done!" : "AI Fill"}
              </button>
            </div>
          </div>

          {/* Category grid */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                const isSelected = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      updateField("category", cat as ExpenseCategory);
                      setAiCategorized(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 text-xs font-medium border transition-all",
                      isSelected
                        ? "border-2 text-white"
                        : "border-white/8 text-slate-500 hover:border-white/15 hover:text-slate-300 bg-white/3"
                    )}
                    style={
                      isSelected
                        ? {
                            background: config.bg,
                            borderColor: config.color,
                            color: config.color,
                          }
                        : {}
                    }
                  >
                    <span className="text-base">{config.icon}</span>
                    <span className="leading-none">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Merchant */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="merchant">
                Merchant (optional)
              </label>
              <input
                id="merchant"
                type="text"
                value={form.merchant}
                onChange={(e) => updateField("merchant", e.target.value)}
                placeholder="e.g. Swiggy"
                className="input-dark w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="expense_date">
                Date *
              </label>
              <input
                id="expense_date"
                type="date"
                value={form.expense_date}
                onChange={(e) => updateField("expense_date", e.target.value)}
                required
                className="input-dark w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="notes">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Any additional details..."
              rows={2}
              className="input-dark w-full rounded-xl px-4 py-3 text-sm resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <Link
              href="/expenses"
              className="flex-1 text-center rounded-xl py-3 px-4 text-sm font-semibold bg-white/5 border border-white/8 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              id="save-expense-btn"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold",
                "bg-gradient-to-r from-brand-500 to-violet-600 text-white",
                "hover:from-brand-400 hover:to-violet-500 transition-all duration-200",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "shadow-lg shadow-brand-500/20"
              )}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Expense"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
