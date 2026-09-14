import { NextRequest, NextResponse } from "next/server";
import { geminiPro } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMonthRange, getLastMonthRange, formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch user's expense data as context
    const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
    const { start: lastStart, end: lastEnd } = getLastMonthRange();

    const [
      { data: thisMonthExpenses },
      { data: lastMonthExpenses },
      { data: budgets },
      { data: profile },
    ] = await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("expense_date", monthStart)
        .lte("expense_date", monthEnd)
        .returns<Expense[]>(),
      supabase
        .from("expenses")
        .select("amount, category")
        .eq("user_id", user.id)
        .gte("expense_date", lastStart)
        .lte("expense_date", lastEnd),
      supabase.from("budgets").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("currency_symbol, full_name").eq("id", user.id).single(),
    ]);

    const symbol = profile?.currency_symbol ?? "₹";
    const thisTotal = (thisMonthExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
    const lastTotal = (lastMonthExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0);

    // Build category summary
    const catSummary: Record<string, number> = {};
    (thisMonthExpenses ?? []).forEach((e) => {
      catSummary[e.category] = (catSummary[e.category] ?? 0) + Number(e.amount);
    });

    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const systemContext = `You are SpendSmart AI, a personal finance assistant for ${profile?.full_name ?? "the user"}.
Today is ${currentDate}. Currency: INR (₹).

CURRENT MONTH EXPENSES (${monthStart} to ${monthEnd}):
Total spent: ${formatCurrency(thisTotal, symbol)}
Number of transactions: ${(thisMonthExpenses ?? []).length}

Category breakdown this month:
${Object.entries(catSummary)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amt]) => `- ${cat}: ${formatCurrency(amt, symbol)}`)
  .join("\n")}

Top 5 individual expenses this month:
${(thisMonthExpenses ?? [])
  .sort((a, b) => Number(b.amount) - Number(a.amount))
  .slice(0, 5)
  .map((e) => `- ${e.description} (${e.category}): ${formatCurrency(Number(e.amount), symbol)} on ${e.expense_date}`)
  .join("\n")}

LAST MONTH:
Total: ${formatCurrency(lastTotal, symbol)}
Transactions: ${(lastMonthExpenses ?? []).length}

MONTHLY BUDGETS:
${(budgets ?? []).map((b) => {
  const actual = catSummary[b.category] ?? 0;
  const pct = ((actual / Number(b.monthly_limit)) * 100).toFixed(0);
  return `- ${b.category}: ${formatCurrency(actual, symbol)} / ${formatCurrency(Number(b.monthly_limit), symbol)} (${pct}% used)`;
}).join("\n") || "No budgets set."}

Be concise, helpful, and friendly. Use INR (₹) for all amounts. Format numbers with Indian locale (e.g., ₹1,23,456). Give actionable insights.`;

    // Build conversation history for Gemini
    const chatHistory = (history ?? []).map((h: { role: string; content: string }) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    }));

    const chat = geminiPro.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemContext }],
        },
        {
          role: "model",
          parts: [{ text: "Understood! I have your complete expense data. How can I help you analyze your finances?" }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Chat error:", message);
    return NextResponse.json({
      response: `API Error: ${message}`,
    });
  }
}
