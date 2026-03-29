import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash-latest", // Use flash for speed and reliability
  generationConfig: {
    responseMimeType: "application/json",
  }
});