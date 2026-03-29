import { NextRequest, NextResponse } from "next/server";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/openai";
import { MARIA_CONTEXT } from "@/lib/patient";
import { triggerEmergencyEmail } from "@/lib/sos";
import { logMessage } from "@/lib/store";

type CopilotResponse = {
  reply: string;
  current_step: 1 | 2 | 3 | 4 | 5;
  sentiment_score: number;
  escalate: boolean;
  recommendations: string[];
  agent?: string;
};

const RED_FLAG_SYMPTOMS = [
  "chest pain",
  "chest tightness",
  "shortness of breath",
  "severe shortness of breath",
  "dizziness",
  "dizzy",
  "nausea",
  "heart fluttering",
  "fluttering",
  "racing heart",
  "something feels wrong",
];

function detectRedFlag(transcript: string) {
  const normalized = transcript.toLowerCase();
  return RED_FLAG_SYMPTOMS.find((symptom) => normalized.includes(symptom)) ?? null;
}

function parseResponse(text: string): CopilotResponse | null {
  const cleanJson = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleanJson) as Partial<CopilotResponse>;
    if (
      typeof parsed.reply === "string" &&
      typeof parsed.current_step === "number" &&
      typeof parsed.sentiment_score === "number" &&
      typeof parsed.escalate === "boolean" &&
      Array.isArray(parsed.recommendations)
    ) {
      return {
        reply: parsed.reply,
        current_step: Math.min(5, Math.max(1, parsed.current_step)) as 1 | 2 | 3 | 4 | 5,
        sentiment_score: parsed.sentiment_score,
        escalate: parsed.escalate,
        recommendations: parsed.recommendations.filter(
          (recommendation): recommendation is string => typeof recommendation === "string"
        ),
        agent: typeof parsed.agent === "string" ? parsed.agent : undefined,
      };
    }
  } catch (error) {
    console.error("Co-pilot JSON parse failed:", error);
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "A valid transcript is required." }, { status: 400 });
    }

    logMessage("user", transcript, "copilot");

    const symptom = detectRedFlag(transcript);
    if (symptom) {
      await triggerEmergencyEmail(symptom);

      const emergencyResponse: CopilotResponse = {
        reply:
          "Maria, stop what you're doing and sit down right now. I'm alerting your care team. Breathe slowly, and if this gets worse, call 911.",
        escalate: true,
        agent: "Guardian Heart",
        current_step: 3,
        sentiment_score: 1,
        recommendations: ["Sit down", "Breathe slowly", "Call 911 if symptoms worsen"],
      };

      logMessage("assistant", emergencyResponse.reply, "copilot");
      return NextResponse.json(emergencyResponse);
    }

    const history = [
      ...[
        {
          role: "user" as const,
          parts: [
            {
              text:
                "Start the daily check-in naturally. Ask one question at a time and keep the tone calm and supportive.",
            },
          ],
        },
      ],
      ...[],
    ];

    const model = gemini.getGenerativeModel({
      model: GEMINI_TEXT_MODEL,
      systemInstruction: `${MARIA_CONTEXT}

You are Pulse, Maria's cardiac rehab co-pilot.

Your job is to guide Maria through a 5-step daily check-in naturally:
1. Mood check
2. Activity check
3. Symptom check
4. Win celebration
5. Tomorrow's nudge

Rules:
- Ask one thing at a time and sound warm, calm, and human.
- Keep replies concise.
- Do not give medical advice or change prescriptions.
- If Maria sounds discouraged, validate her feelings and mention Sofia naturally when helpful.
- Return JSON only with no markdown.

JSON shape:
{
  "reply": "string",
  "current_step": 1 | 2 | 3 | 4 | 5,
  "sentiment_score": number,
  "escalate": boolean,
  "recommendations": ["string"]
}`,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const chat = model.startChat({
      history,
    });
    const result = await chat.sendMessage(transcript);
    const rawText = result.response.text();
    const parsed = parseResponse(rawText);

    if (!parsed) {
      const fallback: CopilotResponse = {
        reply:
          rawText.length > 20
            ? rawText
            : "I’m having trouble organizing that check-in, Maria. Tell me how your day has felt so far.",
        current_step: 1,
        sentiment_score: 5,
        escalate: false,
        recommendations: ["Share how you feel", "Tell me about today’s activity"],
      };
      logMessage("assistant", fallback.reply, "copilot");
      return NextResponse.json(fallback);
    }

    logMessage("assistant", parsed.reply, "copilot");
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Co-pilot Route Error:", error);
    return NextResponse.json({ error: "Unable to process copilot request right now." }, { status: 500 });
  }
}
