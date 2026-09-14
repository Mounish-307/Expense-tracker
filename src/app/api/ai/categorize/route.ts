import { NextRequest, NextResponse } from "next/server";
import { geminiFlash } from "@/lib/gemini";
import { CATEGORIES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { description, merchant } = await req.json();

    if (!description) {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }

    const prompt = `You are an expense categorizer. Given an expense description and optional merchant name, determine the most appropriate category.

Categories available: ${CATEGORIES.join(", ")}

Expense description: "${description}"
${merchant ? `Merchant: "${merchant}"` : ""}

Respond ONLY with valid JSON in this exact format:
{
  "category": "<one of the categories above>",
  "confidence": <number between 0 and 1>,
  "reasoning": "<brief one-line explanation>"
}`;

    const result = await geminiFlash.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ category: "Other", confidence: 0.5, reasoning: "Could not determine" });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate the category
    if (!CATEGORIES.includes(parsed.category)) {
      parsed.category = "Other";
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Categorize error:", err);
    return NextResponse.json({ category: "Other", confidence: 0.3, reasoning: "AI unavailable" });
  }
}
