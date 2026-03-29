import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { randomUUID } from "crypto";

// POST /api/care/video
// Create or join a video call session for an appointment.
// Body: { appointmentId }
//
// MOCKED: In production this would call a video provider (e.g. Daily.co, Twilio Video, Zoom SDK)
// to generate a real room URL and token. For the demo we return a mock session object.
export async function POST(req: NextRequest) {
  const { appointmentId } = await req.json();

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
  }

  const appointment = store.appointments.find((a) => a.id === appointmentId);
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  if (appointment.status === "cancelled") {
    return NextResponse.json({ error: "Cannot start a video call for a cancelled appointment" }, { status: 400 });
  }
  if (appointment.type !== "video-call") {
    return NextResponse.json({ error: "This appointment is not a video-call type" }, { status: 400 });
  }

  // If a session already exists for this appointment, return it
  if (appointment.videoSessionId) {
    const existing = store.videoSessions.find((s) => s.sessionId === appointment.videoSessionId);
    if (existing && existing.status !== "ended") {
      return NextResponse.json({
        session: existing,
        message: "Rejoining existing session",
        // MOCKED: In production, generate a fresh participant token here
        participantToken: `mock-token-${randomUUID().slice(0, 12)}`,
      });
    }
  }

  // Create a new video session
  const sessionId = `vsession-${randomUUID().slice(0, 12)}`;

  const newSession = {
    sessionId,
    appointmentId,
    createdAt: new Date().toISOString(),
    status: "waiting" as const,
    // MOCKED: In production this would be a real Daily.co / Twilio room URL
    joinUrl: `https://pulse-ai.daily.co/${sessionId}`,
  };

  store.videoSessions.push(newSession);
  appointment.videoSessionId = sessionId;

  return NextResponse.json(
    {
      session: newSession,
      message: "Video session created. Waiting for care team to join.",
      // MOCKED fields — replace with real provider SDK calls in production
      provider: "Daily.co (mocked)",
      participantToken: `mock-token-${randomUUID().slice(0, 12)}`,
      careTeamToken: `mock-care-token-${randomUUID().slice(0, 12)}`,
      instructions: [
        "Click the joinUrl to enter the video room.",
        "Allow camera and microphone access when prompted.",
        "Nurse Rivera or Dr. Patel will join shortly.",
        "If the call drops, use the chat to notify your care team.",
      ],
    },
    { status: 201 }
  );
}

// GET /api/care/video?sessionId=xxx
// Get the current status of a video session
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId query param is required" }, { status: 400 });
  }

  const session = store.videoSessions.find((s) => s.sessionId === sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

// PATCH /api/care/video
// Update video session status (e.g. mark as active or ended)
// Body: { sessionId, status: "active" | "ended" }
export async function PATCH(req: NextRequest) {
  const { sessionId, status } = await req.json();

  const session = store.videoSessions.find((s) => s.sessionId === sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  session.status = status;

  // If ending the session, mark the linked appointment as completed
  if (status === "ended") {
    const appointment = store.appointments.find((a) => a.videoSessionId === sessionId);
    if (appointment) appointment.status = "completed";
  }

  return NextResponse.json({ session, message: `Session status updated to '${status}'` });
}
