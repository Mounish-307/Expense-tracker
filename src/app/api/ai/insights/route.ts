import { NextRequest, NextResponse } from "next/server";
import { geminiPro } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMonthRange, formatCurrency } from "@/lib/utils";
import type { Expense, Budget } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { start, end } = getCurrentMonthRange();

    const [{ data: expenses }, { data: budgets }, { data: profile }] = await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("expense_date", start)
        .lte("expense_date", end)
        .returns<Expense[]>(),
      supabase.from("budgets").select("*").eq("user_id", user.id).returns<Budget[]>(),
      supabase.from("profiles").select("currency_symbol").eq("id", user.id).single(),
    ]);

    const symbol = profile?.currency_symbol ?? "₹";
    const total = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
    const catTotals: Record<string, number> = {};
    (expenses ?? []).forEach((e) => {
      catTotals[e.category] = (catTotals[e.category] ?? 0) + Number(e.amount);
    });

    const budgetStatus = (budgets ?? []).map((b) => ({
      category: b.category,
      limit: Number(b.monthly_limit),
      actual: catTotals[b.category] ?? 0,
      pct: ((catTotals[b.category] ?? 0) / Number(b.monthly_limit)) * 100,
    }));

    const overBudget = budgetStatus.filter((b) => b.pct >= 90);
    const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

    const prompt = `Analyze this user's spending for ${new Date().toLocaleString("en-IN", { month: "long" })} and generate 2-3 concise financial insights.

Month total: ${formatCurrency(total, symbol)}
Transactions: ${(expenses ?? []).length}
Top category: ${topCategory ? `${topCategory[0]}: ${formatCurrency(topCategory[1], symbol)}` : "None"}
Budget alerts: ${overBudget.map((b) => `${b.category} at ${b.pct.toFixed(0)}%`).join(", ") || "None"}

Category spending: ${Object.entries(catTotals).map(([k, v]) => `${k}: ${formatCurrency(v, symbol)}`).join(", ")}

Generate insights as JSON. Each insight should be actionable and specific. Types: "tip" (saving advice), "alert" (budget warning), "recommendation" (behavior change), "anomaly" (unusual spending).

Return ONLY:
{
  "insights": [
    {
      "type": "tip|alert|recommendation|anomaly",
      "title": "<short title, max 8 words>",
      "content": "<actionable insight, 1-2 sentences, specific amounts>"
    }
  ]
}`;

    const result = await geminiPro.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ insights: [] });
    }

    const { insights } = JSON.parse(jsonMatch[0]);

    // Store insights in database
    if (insights?.length) {
      const rows = insights.map((i: { type: string; title: string; content: string }) => ({
        user_id: user.id,
        type: i.type,
        title: i.title,
        content: i.content,
      }));
      await supabase.from("ai_insights").insert(rows);
    }

    return NextResponse.json({ insights: insights ?? [] });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json({ insights: [] });
  }
}
