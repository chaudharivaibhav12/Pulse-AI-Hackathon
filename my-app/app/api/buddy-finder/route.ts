import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/openai";
import { MARIA_CONTEXT } from "@/lib/patient";
import {
  getAvailableBuddyUsers,
  getBuddyConnectionState,
  getRecoveryCircle,
  logMessage,
  registerUser,
  store,
} from "@/lib/store";

const SYSTEM_PROMPT = `
You are the Buddy Network coordinator for Maria's cardiac rehab platform.
Your job is to help Maria connect with recovery peers and facilitate group accountability.
You do NOT give medical advice.

What you can help with:
- Coordinating a shared walk
- Coordinating a check-in call
- Coordinating attending rehab together
- Encouraging Maria using the group streak

Week-8 retention mechanic:
- Reference the Recovery Circle streak naturally when helpful
- Example: "Your Recovery Circle has a 3-day streak going. Your buddies are counting on you."

Transportation support:
- If Maria mentions transportation difficulty, only suggest coordinating with buddies who are actually available in the provided context.
- Carpool is always opt-in only and only when a real buddy exists.

Safety and privacy rules:
- Never give medical advice
- If medical questions come up, say: "That's a great one for your care team."
- Never share home addresses, exact locations, phone numbers, or contact details
- Only mention profile details that are present in the provided context
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
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "A valid message is required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    registerUser({
      email,
      name: session.user?.name,
      image: session.user?.image,
    });

    const availableBuddies = getAvailableBuddyUsers(email);
    const recoveryCircle = getRecoveryCircle(email);
    const connectionState = getBuddyConnectionState(email);

    if (availableBuddies.length === 0) {
      return NextResponse.json({
        reply:
          "You do not have any real buddies in your network yet. Ask another user to sign in first, then you can start connecting here.",
        mode: "buddy",
        buddies: [],
        recoveryCircle,
      });
    }

    if (hasRedFlagSymptoms(message)) {
      return NextResponse.json({
        reply:
          "I'm glad you told me. Because you mentioned symptoms, I'm pausing buddy coordination for now. Please stop activity immediately and contact your care team right away. If this feels urgent or severe, seek emergency help now.",
        mode: "sos",
        buddies: availableBuddies,
        recoveryCircle,
      });
    }

    logMessage("user", message, "buddy");

    const buddyContext = `
Current signed-in user: ${JSON.stringify({ email, name: session.user?.name })}.
Available buddies: ${JSON.stringify(availableBuddies)}.
Connection state: ${JSON.stringify(connectionState)}.
Recovery Circle: ${JSON.stringify(recoveryCircle)}.
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
      buddies: availableBuddies,
      recoveryCircle,
    });
  } catch (error) {
    console.error("Buddy route error:", error);

    return NextResponse.json(
      { error: "Unable to process buddy request right now." },
      { status: 500 }
    );
  }
}
