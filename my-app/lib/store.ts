// lib/store.ts
export const store = {
  patient: {
    name: "Maria",
    age: 58,
    rehabWeek: 3,
    rehabDay: 15,
    totalSessions: 36,
    completedSessions: 8,
    currentMedications: ["Aspirin 81mg", "Atorvastatin 40mg", "Metoprolol 25mg"],
    stentDate: "2026-03-08",
    careTeam: { doctor: "Dr. Patel", nurse: "Nurse Rivera" },
    emergencyContact: { name: "Sofia (daughter)", phone: "555-0192" },
    lastHeartRate: 72,
    lastBloodPressure: "128/82",
  },
  sessions: [] as Array<{ date: string; duration: number; mood: number; notes: string }>,
  nutritionLog: [] as Array<{ date: string; item: string; verdict: string }>,
  buddies: [
    { id: "b1", name: "Robert", age: 63, rehabWeek: 6, distance: "2.1 miles", sharedCenter: true, language: "English" },
    { id: "b2", name: "Diane", age: 55, rehabWeek: 3, distance: "3.4 miles", sharedCenter: true, language: "English" },
  ],
  progressLog: [] as Array<{ week: number; anxietyScore: number; sessionsCompleted: number; badges: string[] }>,
  messages: [] as Array<{ role: string; content: string; feature: string; timestamp: string }>,
  sosLog: [] as Array<{ timestamp: string; type: string; resolved: boolean }>,
  appointments: [
    {
      id: "apt-1",
      patientName: "Maria",
      doctor: "Dr. Patel",
      nurse: "Nurse Rivera",
      date: "2026-04-02",
      time: "10:00",
      type: "check-in" as "check-in" | "video-call" | "in-person",
      status: "scheduled" as "scheduled" | "cancelled" | "completed",
      notes: "Week 3 progress review",
      videoSessionId: null as string | null,
    },
  ] as Array<{
    id: string;
    patientName: string;
    doctor: string;
    nurse: string;
    date: string;
    time: string;
    type: "check-in" | "video-call" | "in-person";
    status: "scheduled" | "cancelled" | "completed";
    notes: string;
    videoSessionId: string | null;
  }>,
  videoSessions: [] as Array<{
    sessionId: string;
    appointmentId: string;
    createdAt: string;
    status: "waiting" | "active" | "ended";
    joinUrl: string;
  }>,
};

export function logMessage(role: string, content: string, feature: string) {
  store.messages.push({ role, content, feature, timestamp: new Date().toISOString() });
}
