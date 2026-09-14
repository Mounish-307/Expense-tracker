import { NextRequest, NextResponse } from "next/server";
import { geminiFlash } from "@/lib/gemini";
import { CATEGORIES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    const prompt = `You are a receipt scanner. Extract expense information from this receipt image.

Categories: ${CATEGORIES.join(", ")}

Extract and return ONLY valid JSON with these fields (use null for anything you cannot determine):
{
  "amount": <number or null>,
  "merchant": "<string or null>",
  "description": "<brief description of what was purchased or null>",
  "category": "<one category from the list or null>",
  "date": "<YYYY-MM-DD format or null>"
}`;

    const result = await geminiFlash.generateContent([
      {
        inlineData: {
          mimeType: mimeType ?? "image/jpeg",
          data: image,
        },
      },
      prompt,
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({});
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate category
    if (parsed.category && !CATEGORIES.includes(parsed.category)) {
      parsed.category = null;
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Receipt OCR error:", err);
    return NextResponse.json({});
  }
}
