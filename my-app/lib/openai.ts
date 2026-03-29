// lib/openai.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash";
