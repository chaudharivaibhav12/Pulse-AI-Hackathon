import { NextRequest, NextResponse } from "next/server";
import { store, logMessage } from "@/lib/store";
import { MARIA_CONTEXT } from "@/lib/patient";
import { triggerEmergencyEmail } from "@/lib/sos";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 1. TOOL DEFINITION
    const tools = [
      {
        function_declarations: [
          {
            name: "trigger_guardian_heart_sos",
            description: "IMMEDIATELY call this if Maria reports chest pain, dizziness, heart fluttering, or severe shortness of breath.",
            parameters: {
              type: "object",
              properties: {
                reason: { type: "string", description: "The specific symptom detected." },
                severity: { type: "string", enum: ["high", "critical"] }
              },
              required: ["reason", "severity"]
            }
          }
        ]
      }
    ];

    const copilotPrompt = `
      ${MARIA_CONTEXT}

      You are Pulse, Maria's cardiac rehab co-pilot. 
      
      USER INPUT: "${transcript}"

      GOAL: Guide Maria through the 5-step Daily Check-in naturally:
      1. Mood check (1-10)
      2. Activity check (Walking/Movement)
      3. Symptom check (Chest tightness, dizziness, shortness of breath)
      4. Win celebration (Celebrate any small victory)
      5. Tomorrow's nudge (One gentle goal)

      SAFETY OVERRIDE (PRIORITY 1):
      If input mentions: chest pain, dizziness, shortness of breath, nausea, heart fluttering, or "something feels wrong":
      - Call 'trigger_guardian_heart_sos' immediately.
      - Return the specific safety reply.

      SENTIMENT RULES:
      - Mood ≤ 3 or phrases like "tired/scared/not worth it": Use deep empathy, validate feelings, mention her daughter Sofia.
      - Mood ≥ 7: Celebrate enthusiastically!

      STRICT JSON OUTPUT ONLY (No markdown backticks):
      {
        "reply": "string",
        "current_step": 1 | 2 | 3 | 4 | 5,
        "sentiment_score": number,
        "escalate": boolean,
        "recommendations": ["string"]
      }

      IMPORTANT: Your response must be a raw JSON object. Do not include markdown formatting or backticks.
    `;

    // 2. THE REQUEST
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `User said: "${transcript}"\n\nInstructions: ${copilotPrompt}` }] 
        }],
        tools: tools,
        tool_config: { function_calling_config: { mode: "AUTO" } },
        generationConfig: { 
          temperature: 0.7 
        }
      })
    });

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Gemini returned an empty response.");
    }

    const part = data.candidates[0].content.parts[0];

    // 3. AGENT EXECUTION (Function Call Check)
    if (part.functionCall) {
      const { name, args } = part.functionCall;
      
      if (name === "trigger_guardian_heart_sos") {
        await triggerEmergencyEmail(args.reason);
        return NextResponse.json({
          reply: "Maria, stop what you're doing and sit down right now. I'm alerting your care team. You do not need to worry — just breathe slowly. If this gets worse, call 911.",
          escalate: true,
          agent: "Guardian Heart",
          current_step: 3,
          sentiment_score: 1,
          recommendations: ["Sit down", "Breathe slowly", "Wait for help"]
        });
      }
    }

    // 4. STANDARD FLOW (With Sanitization)
    const rawText = part.text || "{}";
    
    // Remove Markdown code blocks (```json ... ```) if they exist
    const cleanJson = rawText.replace(/```json|```/g, "").trim();

    try {
      const aiResponse = JSON.parse(cleanJson);
      return NextResponse.json(aiResponse);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text was:", rawText);
      // Fallback response for the UI
      return NextResponse.json({
        reply: rawText.length > 20 ? rawText : "I'm having a little trouble with my data, Maria. How are you feeling right now?",
        escalate: false,
        current_step: 1,
        sentiment_score: 5,
        recommendations: ["Let's keep chatting"]
      });
    }

  } catch (error: any) {
    console.error("Co-pilot Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}