import { NextRequest, NextResponse } from "next/server";
import { logMessage, store } from "@/lib/store";
import { buildExerciseSession } from "@/lib/exercise-plan";

function normalizeFearScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 4;
  }

  return Math.min(10, Math.max(1, Math.round(value)));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fearScore = normalizeFearScore(body.fearScore);
    const message =
      typeof body.message === "string" && body.message.trim().length > 0
        ? body.message.trim()
        : "Create today's exercise guidance from the PDF routine.";

    logMessage("user", `${message} (fear score ${fearScore})`, "exercise");

    const session = await buildExerciseSession(fearScore);
    const lastHeartRate = store.patient?.lastHeartRate || 72;

    const reply =
      fearScore >= 7
        ? "We picked the gentlest exercises from your PDF today. Each demo is only 5 seconds so Maria can move with confidence."
        : fearScore >= 4
          ? "We used the PDF routine and softened the pacing a little. The short demos keep each step easy to follow."
          : "Today's session comes straight from the PDF routine, with quick animated demos Maria can replay anytime.";

    logMessage("assistant", reply, "exercise");

    return NextResponse.json({
      reply,
      ...session,
      metrics: {
        heartRate: lastHeartRate,
        intensityAdjusted: fearScore > 3,
      },
    });
  } catch (error) {
    console.error("[/api/exercise] Error:", error);
    return NextResponse.json({ error: "Exercise plan unavailable." }, { status: 500 });
  }
}
