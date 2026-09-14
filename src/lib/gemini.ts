import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Primary model: Gemini 2.5 Flash Lite — fast, multimodal, no thinking overhead
export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-3.5-flash-lite",
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 2048,
  },
});

// For reasoning tasks (chat, insights, recommendations)
export const geminiPro = genAI.getGenerativeModel({
  model: "gemini-3.5-flash-lite",
  generationConfig: {
    temperature: 0.5,
    maxOutputTokens: 4096,
  },
});

export { genAI };
