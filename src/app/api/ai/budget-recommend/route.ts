import { NextRequest, NextResponse } from "next/server";
import { geminiPro } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import type { Expense } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get 3 months of data
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const [{ data: expenses }, { data: currentBudgets }] = await Promise.all([
      supabase
        .from("expenses")
        .select("amount, category, expense_date")
        .eq("user_id", user.id)
        .gte("expense_date", threeMonthsAgo.toISOString().split("T")[0])
        .returns<Partial<Expense>[]>(),
      supabase.from("budgets").select("*").eq("user_id", user.id),
    ]);

    // Simpler: sum per category, divide by 3
    const catTotal: Record<string, number> = {};
    (expenses ?? []).forEach((e) => {
      catTotal[e.category!] = (catTotal[e.category!] ?? 0) + Number(e.amount);
    });
    const catAvg = Object.fromEntries(
      Object.entries(catTotal).map(([k, v]) => [k, Math.round(v / 3)])
    );

    const currentBudgetMap = Object.fromEntries(
      (currentBudgets ?? []).map((b) => [b.category, Number(b.monthly_limit)])
    );

    const prompt = `You are a personal finance advisor. Based on 3 months of spending data, recommend monthly budget limits for each category.

Average monthly spending per category (INR):
${Object.entries(catAvg)
  .map(([cat, avg]) => `- ${cat}: ₹${avg.toLocaleString("en-IN")}`)
  .join("\n")}

Current budgets set:
${Object.entries(currentBudgetMap)
  .map(([cat, limit]) => `- ${cat}: ₹${limit.toLocaleString("en-IN")}`)
  .join("\n") || "None"}

For each category with spending data, recommend a budget. Budget should be:
- 10-20% above average for essential categories (Food, Transport, Bills, Health)
- At average or 10% above for discretionary (Shopping, Entertainment, Travel, Other)
- Flag if current budget seems too tight or too generous

Return ONLY valid JSON:
{
  "recommendations": [
    {
      "category": "<category name>",
      "recommended": <number>,
      "current": <number or null>,
      "reason": "<one concise sentence explaining why>"
    }
  ]
}`;

    const result = await geminiPro.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ recommendations: [] });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Budget recommend error:", err);
    return NextResponse.json({ recommendations: [] });
  }
}
