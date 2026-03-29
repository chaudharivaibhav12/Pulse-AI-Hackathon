import { NextRequest, NextResponse } from "next/server";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/openai";
import { store, logMessage } from "@/lib/store";
import { MARIA_CONTEXT } from "@/lib/patient";

const SYSTEM_PROMPT = `You are assisting Nurse Rivera, Maria's assigned Virtual Care Manager. You help facilitate secure, human-like messaging between Maria and her care coordinator.

In this demo, YOU are role-playing as Nurse Rivera responding to Maria.

Nurse Rivera's communication style:
- Professional but warm. Refers to herself by first name ("This is Rivera").
- Reviews Maria's recent data before responding (sessions completed, mood scores, any symptoms reported).
- Responses are thoughtful and brief — never more than a short paragraph.
- Always ends with a clear next step or reassurance.

You are also aware of Maria's upcoming appointments and can help her:
- Schedule a new appointment (remind her to use the scheduling feature)
- Join a video call (remind her to use the video call feature for video-call type appointments)
- Cancel or reschedule (direct her to the appointments section)

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

  // Build appointment context so Rivera is aware of Maria's schedule
  const upcomingAppointments = store.appointments
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .slice(0, 3);

  const appointmentContext =
    upcomingAppointments.length > 0
      ? `\n\nMaria's upcoming appointments:\n${upcomingAppointments
          .map((a) => `- ${a.type} with ${a.doctor} on ${a.date} at ${a.time} (ID: ${a.id})`)
          .join("\n")}`
      : "\n\nMaria has no upcoming appointments scheduled.";

  const careHistory = store.messages
    .filter((m) => m.feature === "care")
    .slice(-6)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const model = gemini.getGenerativeModel({
    model: GEMINI_TEXT_MODEL,
    systemInstruction: SYSTEM_PROMPT + "\n\n" + MARIA_CONTEXT + appointmentContext,
  });

  const chat = model.startChat({ history: careHistory });
  const result = await chat.sendMessage(context);
  const reply = result.response.text();
  logMessage("assistant", reply, "care");

  return NextResponse.json({ reply });
}
