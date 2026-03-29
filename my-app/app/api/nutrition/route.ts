import { NextRequest, NextResponse } from "next/server";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/openai";
import { MARIA_CONTEXT } from "@/lib/patient";
import { logMessage, store } from "@/lib/store";

export const runtime = "nodejs";

type RequestBody = {
  message?: string;
  imageDataUrl?: string;
};

type NutritionVerdict = "yes" | "sometimes" | "no";
type NutritionConfidence = "high" | "medium" | "low";

type NutritionAssessment = {
  foodName: string;
  ingredients: string[];
  verdict: NutritionVerdict;
  confidence: NutritionConfidence;
  reason: string;
  recommendation: string;
  healthierSwap?: string;
  reply: string;
};

const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
}

function parseAssessment(text: string): NutritionAssessment | null {
  const cleanJson = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleanJson) as Partial<NutritionAssessment>;

    if (
      typeof parsed.foodName === "string" &&
      Array.isArray(parsed.ingredients) &&
      (parsed.verdict === "yes" || parsed.verdict === "sometimes" || parsed.verdict === "no") &&
      (parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low") &&
      typeof parsed.reason === "string" &&
      typeof parsed.recommendation === "string" &&
      typeof parsed.reply === "string"
    ) {
      return {
        foodName: parsed.foodName,
        ingredients: parsed.ingredients.filter(
          (ingredient): ingredient is string => typeof ingredient === "string" && ingredient.trim().length > 0
        ),
        verdict: parsed.verdict,
        confidence: parsed.confidence,
        reason: parsed.reason,
        recommendation: parsed.recommendation,
        healthierSwap: typeof parsed.healthierSwap === "string" ? parsed.healthierSwap : undefined,
        reply: parsed.reply,
      };
    }
  } catch (error) {
    console.error("[/api/nutrition] JSON parse failed:", error);
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : "";

    if (!message && !imageDataUrl) {
      return NextResponse.json({ error: "Add a food photo or a short question first." }, { status: 400 });
    }

    const parsedImage = imageDataUrl ? parseDataUrl(imageDataUrl) : null;

    if (imageDataUrl && !parsedImage) {
      return NextResponse.json({ error: "The uploaded image format is invalid." }, { status: 400 });
    }

    if (parsedImage && !SUPPORTED_IMAGE_MIME_TYPES.has(parsedImage.mimeType)) {
      return NextResponse.json(
        { error: "Please upload a JPG, PNG, or WEBP image for nutrition analysis." },
        { status: 400 }
      );
    }

    const recentNutritionHistory = store.nutritionLog.slice(-5);
    const historyContext =
      recentNutritionHistory.length > 0
        ? recentNutritionHistory
            .map((entry) => `- ${entry.date}: ${entry.item} -> ${entry.verdict}`)
            .join("\n")
        : "No prior food checks yet.";

    const model = gemini.getGenerativeModel({
      model: GEMINI_TEXT_MODEL,
      systemInstruction: `${MARIA_CONTEXT}

You are Grocery Guard, Maria's heart-health nutrition coach.

Your job:
- If a food photo is provided, identify the food and list likely ingredients.
- Judge whether Maria should eat it right now for cardiac rehab.
- Use Maria's recent nutrition history to stay consistent.
- Prefer calm, supportive language and simple explanations.
- If you are uncertain from the image, say so clearly.

Verdict rules:
- "yes" = generally aligned with Maria's heart-healthy plan.
- "sometimes" = okay in smaller portions or with a tweak.
- "no" = not a good fit right now because of sodium, saturated fat, heavy frying, or sugar.

Return JSON only with this shape:
{
  "foodName": "string",
  "ingredients": ["string"],
  "verdict": "yes" | "sometimes" | "no",
  "confidence": "high" | "medium" | "low",
  "reason": "string",
  "recommendation": "string",
  "healthierSwap": "string",
  "reply": "string"
}`,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const prompt = `RECENT NUTRITION HISTORY
${historyContext}

USER NOTE
${message || "No additional note provided."}

TASK
1. Identify the food from the image if one is attached.
2. Infer likely ingredients.
3. Decide whether Maria should eat it using the verdict rules.
4. Explain why in a calm, concise way.
5. Suggest a better swap when appropriate.`;

    const parts = [
      ...(parsedImage
        ? [
            {
              inlineData: {
                data: parsedImage.data,
                mimeType: parsedImage.mimeType,
              },
            },
          ]
        : []),
      { text: prompt },
    ];

    const result = await model.generateContent(parts);
    const assessment = parseAssessment(result.response.text());

    if (!assessment) {
      return NextResponse.json({ error: "I couldn't understand that food check clearly enough. Please try again." }, { status: 502 });
    }

    store.nutritionLog.push({
      date: new Date().toISOString().slice(0, 10),
      item: assessment.foodName,
      verdict: assessment.verdict,
    });

    logMessage("user", message || "Uploaded a food photo", "nutrition");
    logMessage("assistant", assessment.reply, "nutrition");

    return NextResponse.json({
      ...assessment,
      recentHistory: store.nutritionLog.slice(-5).reverse(),
    });
  } catch (error) {
    console.error("[/api/nutrition] Error:", error);
    return NextResponse.json({ error: "Unable to check that food right now." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    recentHistory: store.nutritionLog.slice(-5).reverse(),
  });
}
