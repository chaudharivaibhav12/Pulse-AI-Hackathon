import { NextRequest, NextResponse } from "next/server";
import { googleAI } from "@/lib/gemini"; 
import { store } from "@/lib/store";
import { MARIA_CONTEXT } from "@/lib/patient";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const { message, fearScore, history = [] } = await req.json();
    const lastHeartRate = store.patient?.lastHeartRate || 72;

    // 1. HARD-CODED SAFETY LOGIC (The "Confidence Engine" Gatekeeper)
    let safetyInstruction = "";
    if (fearScore >= 1 && fearScore <= 3) {
      safetyInstruction = "Maria's score is 1-3. Start with: 'You're feeling great today! Let's do your full session.' Stick to the full PDF plan.";
    } else if (fearScore >= 4 && fearScore <= 6) {
      safetyInstruction = "Maria's score is 4-6. Start with: 'Let's start a little gentler and build up as you feel comfortable.' Reduce PDF exercise repetitions by 30%.";
    } else if (fearScore >= 7 && fearScore <= 10) {
      safetyInstruction = "Maria's score is 7-10. Start with: 'I hear you. Let's do just 5 minutes of very gentle movement — that still counts, and your heart will thank you.' IGNORE the full PDF workout; suggest only 1-2 very light movements.";
    }

    // 2. Load the PDF
    const pdfPath = "./public/data/maria_exercise_plan.pdf";
    const pdfBuffer = fs.readFileSync(pdfPath);

    // 3. Initialize Gemini 1.5 Pro (Better for strict logic following)
    const model = googleAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: `${SYSTEM_PROMPT}\n\n${MARIA_CONTEXT}`,
    });

    // 4. Construct the prompt with the FORCED safety instruction
    const promptParts = [
      {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
      { 
        text: `
        CRITICAL STATE:
        - Fear Score: ${fearScore}/10
        - REQUIRED OPENING: ${safetyInstruction}
        - Current Heart Rate: ${lastHeartRate} BPM
        
        USER MESSAGE: ${message}

        TASK: 
        1. Open with the REQUIRED OPENING phrase.
        2. Look at the PDF for the current rehab day.
        3. Adjust the intensity based on the Fear Score logic above.
        4. Provide [VIDEO_ID: slug] for every exercise mentioned.
        ` 
      },
    ];

    const chat = model.startChat({
      history: history.map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
    });

    const result = await chat.sendMessage(promptParts);
    const reply = result.response.text();

    // 5. Extraction Logic
    const videoRegex = /\[VIDEO_ID: (.+?)\]/g;
    const matches = [...reply.matchAll(videoRegex)];
    const suggestedVideos = matches.map(match => match[1]);

    return NextResponse.json({
      reply,
      suggestedVideos,
      metrics: { heartRate: lastHeartRate, intensityAdjusted: fearScore > 3 }
    });

  } catch (err) {
    console.error("[/api/exercise] Error:", err);
    return NextResponse.json({ error: "Safety system unavailable." }, { status: 500 });
  }
}