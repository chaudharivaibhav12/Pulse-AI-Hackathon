import { readFile } from "node:fs/promises";
import { gemini, GEMINI_TEXT_MODEL } from "@/lib/openai";
import { inferAnimationHint, slugifyExerciseName } from "@/lib/exercise-motion";

export type PdfExerciseReference = {
  name: string;
  details: string;
};

export type ExerciseSessionClip = {
  name: string;
  details: string;
  durationLabel: string;
  videoId: string;
  animationHint: ReturnType<typeof inferAnimationHint>;
  demoDurationSeconds: number;
};

export type ExerciseSessionPlan = {
  planTitle: string;
  planSummary: string;
  sourcePdf: string;
  extractedExerciseNames: string[];
  exercises: ExerciseSessionClip[];
};

type ExtractedPdfPlan = {
  planTitle: string;
  exercises: PdfExerciseReference[];
};

const EXERCISE_PDF_URL = new URL("../data_plan/Exercise_Routine.pdf", import.meta.url);
const SOURCE_PDF_NAME = "Exercise_Routine.pdf";

const FALLBACK_PLAN: ExtractedPdfPlan = {
  planTitle: "Exercise routine",
  exercises: [
    {
      name: "Warm-up walk",
      details: "Easy pace to get Maria comfortable before the main workout.",
    },
    {
      name: "Gentle arm circles",
      details: "Small shoulder-friendly circles to loosen the upper body.",
    },
    {
      name: "Seated marching",
      details: "Low-impact marching to build confidence with steady breathing.",
    },
    {
      name: "Cool-down stretch",
      details: "Light lower-body stretching to finish calmly.",
    },
  ],
};

let cachedPlanPromise: Promise<ExtractedPdfPlan> | null = null;

function stripJsonMarkdown(raw: string) {
  return raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
}

function normalizeExtractedPlan(input: unknown): ExtractedPdfPlan {
  if (!input || typeof input !== "object") {
    return FALLBACK_PLAN;
  }

  const candidate = input as {
    planTitle?: unknown;
    exercises?: Array<{ name?: unknown; details?: unknown }>;
  };

  const exercises =
    candidate.exercises
      ?.map((exercise) => ({
        name: typeof exercise?.name === "string" ? exercise.name.trim() : "",
        details: typeof exercise?.details === "string" ? exercise.details.trim() : "",
      }))
      .filter((exercise) => exercise.name.length > 0) ?? [];

  if (exercises.length === 0) {
    return FALLBACK_PLAN;
  }

  return {
    planTitle:
      typeof candidate.planTitle === "string" && candidate.planTitle.trim().length > 0
        ? candidate.planTitle.trim()
        : FALLBACK_PLAN.planTitle,
    exercises,
  };
}

async function extractPlanFromPdf(): Promise<ExtractedPdfPlan> {
  try {
    const pdfBuffer = await readFile(EXERCISE_PDF_URL);

    const model = gemini.getGenerativeModel({
      model: GEMINI_TEXT_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
      `Read this cardiac rehab exercise PDF and return strict JSON with this shape:
{
  "planTitle": "short title",
  "exercises": [
    { "name": "exercise name from the PDF", "details": "one short sentence describing the move" }
  ]
}

Rules:
- Use only exercise names that actually appear in the PDF.
- Keep the exercise order from the routine.
- Return 4 to 10 exercises if possible.
- Do not include markdown or any explanatory text.`,
    ]);

    const text = stripJsonMarkdown(result.response.text());
    return normalizeExtractedPlan(JSON.parse(text));
  } catch (error) {
    console.error("[exercise-plan] Failed to parse PDF routine, using fallback plan.", error);
    return FALLBACK_PLAN;
  }
}

async function getExtractedPdfPlan() {
  if (!cachedPlanPromise) {
    cachedPlanPromise = extractPlanFromPdf();
  }

  return cachedPlanPromise;
}

function getPlanTitle(fearScore: number, pdfTitle: string) {
  if (fearScore >= 7) {
    return "Gentle confidence session";
  }

  if (fearScore >= 4) {
    return "Steady build session";
  }

  return pdfTitle;
}

function getPlanSummary(fearScore: number, exerciseCount: number) {
  if (fearScore >= 7) {
    return `We pulled ${exerciseCount} very gentle movements from your PDF so Maria can build confidence without overdoing it today.`;
  }

  if (fearScore >= 4) {
    return `This plan uses the routine from your PDF with a lighter ramp-up, short 5-second demos, and a calm pacing cue for each move.`;
  }

  return `This session is based directly on the exercise routine PDF and turns each move into a short looping demo Maria can follow at home.`;
}

export async function buildExerciseSession(fearScore: number): Promise<ExerciseSessionPlan> {
  const pdfPlan = await getExtractedPdfPlan();
  const maxExercises = fearScore >= 7 ? 2 : fearScore >= 4 ? 3 : 4;
  const selectedExercises = pdfPlan.exercises.slice(0, maxExercises);

  const exercises = selectedExercises.map((exercise) => ({
    name: exercise.name,
    details: exercise.details,
    durationLabel: "5 sec loop",
    videoId: slugifyExerciseName(exercise.name),
    animationHint: inferAnimationHint(exercise.name, exercise.details),
    demoDurationSeconds: 5,
  }));

  return {
    planTitle: getPlanTitle(fearScore, pdfPlan.planTitle),
    planSummary: getPlanSummary(fearScore, exercises.length),
    sourcePdf: SOURCE_PDF_NAME,
    extractedExerciseNames: pdfPlan.exercises.map((exercise) => exercise.name),
    exercises,
  };
}
