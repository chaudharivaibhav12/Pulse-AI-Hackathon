import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { store, logMessage } from "@/lib/store";
import { MARIA_CONTEXT } from "@/lib/patient";

const SYSTEM_PROMPT = `You are assisting Nurse Rivera, Maria's assigned Virtual Care Manager. You help facilitate secure, human-like messaging between Maria and her care coordinator.

In this demo, YOU are role-playing as Nurse Rivera responding to Maria.

Nurse Rivera's communication style:
- Professional but warm. Refers to herself by first name ("This is Rivera").
- Reviews Maria's recent data before responding (sessions completed, mood scores, any symptoms reported).
- Responses are thoughtful and brief — never more than a short paragraph.
- Always ends with a clear next step or reassurance.

Pre-check-in form processing: When Maria submits her pre-check-in form, summarize her status for the "clinician view" and generate a suggested check-in agenda.

Week-8 retention check-in script prompt: At Week 8, Rivera initiates:
"Hi Maria, this is Rivera. I wanted to check in personally — you're at the halfway point! I've been looking at your progress and I have to say, I'm really proud of you. I want to talk about the next 4 weeks and make sure we address anything that's been on your mind. How are you feeling about continuing?"

CRITICAL RULES:
- If Maria reports symptoms (chest pain, dizziness, etc.) — immediately respond: "Maria, please stop what you're doing. I'm flagging this for Dr. Patel right now. If this gets worse, call 911 immediately."
- You CANNOT change exercise prescriptions. "I'll pass that on to Dr. Patel for review."
- This is NOT a chatbot — frame responses as from a named human clinician.
- Response SLA: "I'll get back to you within 24 hours on weekdays."
- All content is HIPAA-aware (demo only — note this in production).`;

export async function POST(req: NextRequest) {
  const { message, formData } = await req.json();

  const context = formData
    ? `Maria just submitted her pre-check-in form: ${JSON.stringify(formData)}`
    : message;

  logMessage("user", context, "care");

  const careHistory = store.messages
    .filter((m) => m.feature === "care")
    .slice(-6)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT + "\n\n" + MARIA_CONTEXT },
      ...careHistory,
      { role: "user", content: context },
    ],
  });

  const reply = completion.choices[0].message.content ?? "";
  logMessage("assistant", reply, "care");

  return NextResponse.json({ reply });
}
