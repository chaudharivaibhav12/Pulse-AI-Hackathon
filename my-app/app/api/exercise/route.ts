import { NextRequest, NextResponse } from "next/server";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/openai";
import { store, logMessage } from "@/lib/store";
import { MARIA_CONTEXT } from "@/lib/patient";

type ExerciseHistoryItem = {
  role: "user" | "model" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are Pulse AI's exercise guide for Maria's cardiac rehab home sessions.

Your job is to recommend only gentle, cardiac-rehab-appropriate movement.

Rules:
- Keep the response calm, encouraging, and under 5 short sentences.
- Do not provide medical diagnosis or change prescriptions.
- If Maria reports chest pain, dizziness, severe shortness of breath, nausea, or "something feels wrong", tell her to stop immediately and seek urgent help.
- Always adapt intensity to the provided fear score.
- Mention only exercises contained in the supplied rehab plan reference.
- For every exercise you recommend, append a tag in the format [VIDEO_ID: slug].`;

const EXERCISE_PLAN_REFERENCE = `Structured rehab plan reference for Maria, Week 3:
- Warm-up walk [VIDEO_ID: warm-up-walk]: 5 minutes at an easy pace.
- Moderate walking [VIDEO_ID: moderate-walk]: up to 10 minutes if she feels comfortable.
- Cool-down stretch [VIDEO_ID: cool-down-stretch]: 5 minutes, gentle calf and hamstring stretches.
- Deep breathing [VIDEO_ID: deep-breathing]: 2 minutes.
- Gentle arm circles [VIDEO_ID: gentle-arm-circles]: 1 minute.
- Seated marching [VIDEO_ID: seated-marching]: 2 minutes.

Intensity scaling:
- Fear score 1-3: full session is appropriate.
- Fear score 4-6: reduce repetitions or duration by about 30%.
- Fear score 7-10: offer only 1-2 very light movements for about 5 minutes total.`;

function normalizeFearScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 4;
  }

  return Math.min(10, Math.max(1, Math.round(value)));
}

function getSafetyInstruction(fearScore: number) {
  if (fearScore <= 3) {
    return "Open by reassuring Maria that she can try her full home session if she still feels comfortable.";
  }

  if (fearScore <= 6) {
    return "Open by saying you will start a little gentler today and reduce the plan by about 30%.";
  }

  return "Open by validating her fear and offering only 1-2 very gentle movements for about 5 minutes total.";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message =
      typeof body.message === "string" && body.message.trim().length > 0
        ? body.message.trim()
        : "Please guide Maria through today's home exercise session.";
    const fearScore = normalizeFearScore(body.fearScore);
    const history = Array.isArray(body.history) ? (body.history as ExerciseHistoryItem[]) : [];
    const lastHeartRate = store.patient?.lastHeartRate || 72;

    logMessage("user", message, "exercise");

    const exerciseHistory = history
      .filter(
        (item) =>
          typeof item?.content === "string" &&
          (item.role === "user" || item.role === "model" || item.role === "assistant"),
      )
      .slice(-6)
      .map((item) => ({
        role: item.role === "assistant" ? "model" : item.role,
        parts: [{ text: item.content }],
      }));

    const model = gemini.getGenerativeModel({
      model: GEMINI_TEXT_MODEL,
      systemInstruction: `${SYSTEM_PROMPT}\n\n${MARIA_CONTEXT}\n\n${EXERCISE_PLAN_REFERENCE}`,
    });

    const prompt = `CURRENT STATE
- Fear score: ${fearScore}/10
- Current heart rate: ${lastHeartRate} BPM
- Safety instruction: ${getSafetyInstruction(fearScore)}

USER MESSAGE
${message}

TASK
1. Recommend only exercises from the rehab plan reference.
2. Match the intensity to the fear score.
3. Include [VIDEO_ID: slug] tags for each recommended exercise.
4. Keep the tone warm and confidence-building.`;

    const chat = model.startChat({ history: exerciseHistory });
    const result = await chat.sendMessage(prompt);
    const reply = result.response.text();

    logMessage("assistant", reply, "exercise");

    const videoRegex = /\[VIDEO_ID: (.+?)\]/g;
    const suggestedVideos = [...reply.matchAll(videoRegex)].map((match) => match[1]);

    return NextResponse.json({
      reply,
      suggestedVideos,
      metrics: { heartRate: lastHeartRate, intensityAdjusted: fearScore > 3 },
    });
  } catch (err) {
    console.error("[/api/exercise] Error:", err);
    return NextResponse.json({ error: "Safety system unavailable." }, { status: 500 });
  }
}
