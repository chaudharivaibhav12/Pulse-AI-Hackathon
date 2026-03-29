import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { MARIA_CONTEXT } from "@/lib/patient";
import { store } from "@/lib/store";

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

function buildMockReply(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("transport") ||
    normalized.includes("ride") ||
    normalized.includes("drive") ||
    normalized.includes("carpool")
  ) {
    return "You've got people in your corner, Maria. Robert is about 2.1 miles away and drives past your area on Tuesdays. Want me to set up an opt-in ride request for your next clinic visit, or would you rather invite Diane to attend together?";
  }

  if (
    normalized.includes("walk") ||
    normalized.includes("finished") ||
    normalized.includes("completed")
  ) {
    return "That is a real win, Maria. Your Recovery Circle has a 5-day streak going, and Robert and Diane would love to cheer this on. I can help you send a quick update to Diane, who is in the same week as you, or plan a shared walk with Robert for later this week.";
  }

  if (
    normalized.includes("anxious") ||
    normalized.includes("tired") ||
    normalized.includes("skip") ||
    normalized.includes("missed") ||
    normalized.includes("discouraged")
  ) {
    return "That sounds like a hard day, Maria, and you do not have to push through it alone. Diane is going through the same week as you right now, and Robert has already made it through this stretch. Your Recovery Circle has a 5-day streak going. Want me to help you set up a quick check-in call, a shared walk, or a clinic day plan together?";
  }

  return "You've got people in your corner, Maria. Robert is someone who's been where you are and made it through the hard part, and Diane is going through exactly the same week as you right now. I can help you plan a shared walk, a check-in call, or attending rehab together.";
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

    const buddyContext = `
Current buddies: ${JSON.stringify(store.buddies)}.
Recovery Circle: ${JSON.stringify(store.recoveryCircle)}.
Suggested shared activities: ${JSON.stringify(store.sharedActivities)}.
`;

    if (!openai) {
      return NextResponse.json({
        reply: buildMockReply(message),
        mode: "buddy",
        buddies: store.buddies,
        recoveryCircle: store.recoveryCircle,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n${MARIA_CONTEXT}\n${buddyContext}`,
        },
        { role: "user", content: message },
      ],
    });

    return NextResponse.json({
      reply: completion.choices[0]?.message?.content ?? buildMockReply(message),
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
