import { NextRequest, NextResponse } from "next/server";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/openai";
import { store, logMessage } from "@/lib/store";
import { MARIA_CONTEXT } from "@/lib/patient";

const SYSTEM_PROMPT = `You are the Pulse AI Orchestrator for a cardiac rehabilitation platform.
Your patient is Maria, 58, recovering from a heart attack and stent placement 3 weeks ago. She is in Week 3 of a 12-week outpatient cardiac rehab program (8 of 36 sessions completed).

Your job is to:
1. Understand what Maria needs right now.
2. Route her request to the right specialist feature: nutrition, exercise, voice check-in, buddy network, SOS, progress, or care manager.
3. Respond in warm, simple, large-font-friendly language. No medical jargon. Short sentences. Positive and calm tone.
4. If Maria mentions ANY of: chest pain, dizziness, shortness of breath, nausea, racing heart, or "something feels wrong" — IMMEDIATELY stop and respond with the SOS protocol: tell her to sit down, stop activity, and that you are alerting her care team. Do not continue any other topic.

Always remember:
- You support her care plan. You do NOT create or change medical prescriptions.
- Celebrate small wins loudly. A 10-minute walk IS a victory.
- She is afraid. Reassurance comes before information.
- Her daughter Sofia is her motivation anchor — reference her when appropriate.
- Keep responses under 4 sentences unless the user asks for more detail.

When routing, return JSON in this format:
{ "intent": "nutrition|exercise|copilot|buddy|sos|progress|care", "response": "your warm reply", "action": "optional UI action" }`;

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  logMessage("user", message, "main");

  // Build conversation history in Gemini format (roles: "user" | "model")
  const history = store.messages.slice(-10).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const model = gemini.getGenerativeModel({
    model: GEMINI_TEXT_MODEL,
    systemInstruction: SYSTEM_PROMPT + "\n\nPatient context:\n" + MARIA_CONTEXT,
  });

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(message);
  const reply = result.response.text();

  logMessage("assistant", reply, "main");
  return NextResponse.json({ reply });
}
