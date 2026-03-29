import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { openai } from "@/lib/openai";
import { MARIA_CONTEXT } from "@/lib/patient";
import { randomUUID } from "crypto";

// GET /api/care/appointments
// Returns all of Maria's appointments (upcoming first)
export async function GET() {
  const sorted = [...store.appointments].sort(
    (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
  );
  return NextResponse.json({ appointments: sorted });
}

// POST /api/care/appointments
// Schedule a new appointment. Body: { date, time, type, notes? }
// Also uses GPT-4o to generate a confirmation message from Nurse Rivera.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, time, type, notes } = body as {
    date: string;
    time: string;
    type: "check-in" | "video-call" | "in-person";
    notes?: string;
  };

  // Validate required fields
  if (!date || !time || !type) {
    return NextResponse.json(
      { error: "date, time, and type are required" },
      { status: 400 }
    );
  }

  // Prevent duplicate scheduling on same date+time
  const conflict = store.appointments.find(
    (a) => a.date === date && a.time === time && a.status === "scheduled"
  );
  if (conflict) {
    return NextResponse.json(
      { error: "An appointment already exists at this date and time", conflict },
      { status: 409 }
    );
  }

  const id = `apt-${randomUUID().slice(0, 8)}`;

  const newAppointment = {
    id,
    patientName: store.patient.name,
    doctor: store.patient.careTeam.doctor,
    nurse: store.patient.careTeam.nurse,
    date,
    time,
    type,
    status: "scheduled" as const,
    notes: notes ?? "",
    videoSessionId: null as string | null,
  };

  store.appointments.push(newAppointment);

  // Generate a warm confirmation message from Nurse Rivera via GPT-4o
  const SYSTEM_PROMPT = `You are Nurse Rivera, Maria's care coordinator.
Write a short, warm confirmation message (2-3 sentences) for a newly scheduled ${type} appointment on ${date} at ${time}.
Mention what Maria should prepare or expect. Sign off as "Rivera".
Tone: professional, reassuring, personal.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT + "\n\n" + MARIA_CONTEXT },
      { role: "user", content: `Appointment scheduled: ${type} on ${date} at ${time}. Notes: ${notes ?? "None"}` },
    ],
  });

  const confirmation = completion.choices[0].message.content ?? "";

  return NextResponse.json(
    { appointment: newAppointment, confirmation },
    { status: 201 }
  );
}

// PATCH /api/care/appointments
// Cancel an appointment. Body: { id }
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();

  const appointment = store.appointments.find((a) => a.id === id);
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  if (appointment.status === "cancelled") {
    return NextResponse.json({ error: "Appointment is already cancelled" }, { status: 400 });
  }

  appointment.status = "cancelled";

  // If a video session was linked, mark it ended
  if (appointment.videoSessionId) {
    const session = store.videoSessions.find((s) => s.sessionId === appointment.videoSessionId);
    if (session) session.status = "ended";
  }

  return NextResponse.json({ appointment, message: "Appointment cancelled successfully" });
}
