import { NextRequest, NextResponse } from "next/server";
import { triggerEmergencyEmail } from "@/lib/sos";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const reason =
      typeof body.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim()
        : "Maria reported feeling unwell during cardiac rehab.";

    store.sosLog.push({
      timestamp: new Date().toISOString(),
      type: reason,
      resolved: false,
    });

    await triggerEmergencyEmail(reason);

    return NextResponse.json({
      ok: true,
      message: "Emergency alert sent to the care team.",
      reason,
    });
  } catch (error) {
    console.error("SOS route error:", error);
    return NextResponse.json({ error: "Unable to trigger SOS right now." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    events: store.sosLog,
  });
}
