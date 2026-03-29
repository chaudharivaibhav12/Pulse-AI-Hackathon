import { NextRequest, NextResponse } from "next/server";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/openai";
import { MARIA_CONTEXT } from "@/lib/patient";
import { store, logMessage } from "@/lib/store";

const SYSTEM_PROMPT = `
You are the Buddy Network coordinator for Maria's cardiac rehab platform.
Your job is to help Maria connect with recovery peers and facilitate group accountability.
You do NOT give medical advice.

Available buddies in Maria's network:
- Robert, 63, Week 6 of rehab, 2.1 miles away, same rehab center, English
- Diane, 55, Week 3 of rehab, 3.4 miles away, same rehab center, English

How to position buddies:
- Suggest Robert as "someone who's been where you are and made it through the hard part"
- Suggest Diane as "someone going through exactly the same week as you right now"

What you can help with:
- Coordinating a shared walk
- Coordinating a check-in call
- Coordinating attending rehab together
- Encouraging Maria using the group streak

Week-8 retention mechanic:
- Reference the Recovery Circle streak naturally when helpful
- Example: "Your Recovery Circle has a 5-day streak going. Robert and Diane are counting on you."

Transportation support:
- If Maria mentions transportation difficulty, you may suggest:
  "Robert mentioned he drives past your area on Tuesdays. Want me to ask if he can give you a lift to clinic?"
- Carpool is always opt-in only

Safety and privacy rules:
- Never give medical advice
- If medical questions come up, say: "That's a great one for your care team."
- Never share home addresses, exact locations, phone numbers, or contact details
- Only mention approximate distances
- If Maria mentions symptoms, stop buddy coordination and defer to the SOS flow
- Exercise goals come from the care team, not buddies

Tone:
Warm, social, encouraging, lightly energetic.
Make Maria feel supported and connected.
Use language like: "You've got people in your corner, Maria."
`;

const SYMPTOM_KEYWORDS = [
  "chest pain",
  "dizziness",
  "dizzy",
  "shortness of breath",
  "severe shortness of breath",
  "nausea",
  "racing heartbeat",
  "irregular heartbeat",
  "heart racing",
  "palpitations",
  "faint",
  "fainted",
];

function hasRedFlagSymptoms(message: string) {
  const normalized = message.toLowerCase();
  return SYMPTOM_KEYWORDS.some((symptom) => normalized.includes(symptom));
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "A valid message is required." },
        { status: 400 }
      );
    }

    if (hasRedFlagSymptoms(message)) {
      return NextResponse.json({
        reply:
          "I'm glad you told me. Because you mentioned symptoms, I'm pausing buddy coordination for now. Please stop activity immediately and contact your care team right away. If this feels urgent or severe, seek emergency help now.",
        mode: "sos",
        buddies: store.buddies,
        recoveryCircle: store.recoveryCircle,
      });
    }

    logMessage("user", message, "buddy");

    const buddyContext = `
Current buddies: ${JSON.stringify(store.buddies)}.
Recovery Circle: ${JSON.stringify(store.recoveryCircle)}.
Suggested shared activities: ${JSON.stringify(store.sharedActivities)}.
`;

    const history = store.messages
      .filter((m) => m.feature === "buddy")
      .slice(-10)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const model = gemini.getGenerativeModel({
      model: GEMINI_TEXT_MODEL,
      systemInstruction: `${SYSTEM_PROMPT}\n${MARIA_CONTEXT}\n${buddyContext}`,
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    logMessage("assistant", reply, "buddy");

    return NextResponse.json({
      reply,
      mode: "buddy",
      buddies: store.buddies,
      recoveryCircle: store.recoveryCircle,
    });
  } catch (error) {
    console.error("Buddy route error:", error);

    return NextResponse.json(
      { error: "Unable to process buddy request right now." },
      { status: 500 }
    );
  }
}
