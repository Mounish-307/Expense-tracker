"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { DEMO_EXPENSES, DEMO_BUDGETS } from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function seedDemoData(userId: string) {
    const today = new Date();

    // Seed expenses
    const expenseRows = DEMO_EXPENSES.map((e) => {
      const date = new Date(today);
      date.setDate(date.getDate() - e.days_ago);
      return {
        user_id: userId,
        amount: e.amount,
        category: e.category,
        description: e.description,
        merchant: e.merchant,
        expense_date: date.toISOString().split("T")[0],
        ai_categorized: true,
        ai_confidence: 0.92,
      };
    });

    await supabase.from("expenses").insert(expenseRows);

    // Seed budgets
    const budgetRows = DEMO_BUDGETS.map((b) => ({
      user_id: userId,
      category: b.category,
      monthly_limit: b.monthly_limit,
    }));

    await supabase.from("budgets").insert(budgetRows);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Seed demo data for new user
    if (data.user) {
      await seedDemoData(data.user.id);
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SpendSmart</span>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
            <p className="text-slate-400 text-sm">
              Start tracking smarter — includes demo data to explore.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="full-name">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Sharma"
                  required
                  className="input-dark w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="signup-email">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-dark w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="signup-password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="input-dark w-full rounded-xl pl-10 pr-11 py-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              id="signup-submit-btn"
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold mt-2",
                "bg-gradient-to-r from-brand-500 to-violet-600 text-white",
                "hover:from-brand-400 hover:to-violet-500 transition-all duration-200",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "shadow-lg shadow-brand-500/25"
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
