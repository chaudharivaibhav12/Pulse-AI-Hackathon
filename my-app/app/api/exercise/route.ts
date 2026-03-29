import { NextRequest, NextResponse } from "next/server";
import { googleAI } from "@/lib/gemini"; 
import { store } from "@/lib/store";
import { MARIA_CONTEXT } from "@/lib/patient";
import { SYSTEM_PROMPT } from "@/lib/prompt"; // Assume the Exercise System Prompt is exported here

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestBody {
  message: string;
  fearScore?: number; // 1-10 scale
  history?: { role: "user" | "model"; content: string }[];
}

// ─── POST /api/exercise ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { message, fearScore, history = [] } = body;

    // Mocking the "Wearable Data" from your store
    // In a real app, this would be a live hook to a Fitbit/Apple Watch
    const lastHeartRate = store.patient?.lastHeartRate || 72; 

    // 1. Initialize Gemini with Exercise-specific System Prompt
    const model = googleAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `${SYSTEM_PROMPT}\n\nPATIENT PROFILE:\n${MARIA_CONTEXT}`,
    });

    // 2. Prepare the prompt with the Fear Score and Heart Rate Context
    // This ensures the AI addresses her anxiety and current physical state immediately.
    let enrichedMessage = message;
    if (fearScore !== undefined) {
      enrichedMessage = `[Current Fear Score: ${fearScore}/10] [Current Heart Rate: ${lastHeartRate} BPM] ${message}`;
    }

    // 3. Format history for Gemini
    const chatHistory = history
      .filter((m) => m.role === "user" || m.role === "model")
      .map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

    // 4. Start Chat & Send Message
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.6, // Slightly lower for more consistent medical-adjacent safety
        maxOutputTokens: 600,
      },
    });

    const result = await chat.sendMessage(enrichedMessage);
    const reply = result.response.text();

    // 5. Persist the activity to the store (for the Progress/Dashboard page)
    store.appendExerciseLog?.({
      date: new Date().toISOString(),
      activity: "Coached Session",
      fearScore: fearScore,
      heartRate: lastHeartRate
    });

    return NextResponse.json({
      reply,
      metrics: {
        heartRate: lastHeartRate,
        sessionStatus: "active"
      }
    });

  } catch (err) {
    console.error("[/api/exercise] Gemini Error:", err);
    return NextResponse.json(
      { error: "The Confidence Engine is offline. Please rest until we're back." },
      { status: 500 }
    );
  }
}

// ─── GET /api/exercise ────────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({ history: store.getExerciseHistory?.() || [] });
}