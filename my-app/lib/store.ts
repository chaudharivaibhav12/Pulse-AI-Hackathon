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
  sharedActivities: [
    { id: "a1", type: "shared_walk", label: "Shared walk later this week" },
    { id: "a2", type: "check_in_call", label: "Quick check-in call" },
    { id: "a3", type: "clinic_day_plan", label: "Attend rehab together" },
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
  buddyConnectionsByUser: {} as Record<
    string,
    {
      connectedBuddyIds: string[];
      plannedBuddyIds: string[];
      updatedAt: string;
    }
  >,
  usersByEmail: {} as Record<
    string,
    {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      joinedAt: string;
      lastSeenAt: string;
    }
  >,
};

export function logMessage(role: string, content: string, feature: string) {
  store.messages.push({ role, content, feature, timestamp: new Date().toISOString() });
}

export function getBuddyConnectionState(email: string) {
  if (!store.buddyConnectionsByUser[email]) {
    store.buddyConnectionsByUser[email] = {
      connectedBuddyIds: [],
      plannedBuddyIds: [],
      updatedAt: new Date().toISOString(),
    };
  }

  return store.buddyConnectionsByUser[email];
}

export function setBuddyConnectionState(
  email: string,
  buddyId: string,
  type: "connected" | "planned",
  value: boolean
) {
  const state = getBuddyConnectionState(email);
  const key = type === "connected" ? "connectedBuddyIds" : "plannedBuddyIds";
  const nextIds = new Set(state[key]);

  if (value) {
    nextIds.add(buddyId);
  } else {
    nextIds.delete(buddyId);
  }

  state[key] = Array.from(nextIds);
  state.updatedAt = new Date().toISOString();

  return state;
}

export function registerUser(user: { email: string; name?: string | null; image?: string | null }) {
  const existing = store.usersByEmail[user.email];
  const now = new Date().toISOString();

  store.usersByEmail[user.email] = {
    id: user.email,
    email: user.email,
    name: user.name?.trim() || user.email.split("@")[0],
    image: user.image ?? existing?.image ?? null,
    joinedAt: existing?.joinedAt ?? now,
    lastSeenAt: now,
  };

  return store.usersByEmail[user.email];
}

export function getAvailableBuddyUsers(currentUserEmail: string) {
  return Object.values(store.usersByEmail).filter((user) => user.email !== currentUserEmail);
}

export function getRecoveryCircle(email: string) {
  const currentUser = store.usersByEmail[email];
  const connectionState = getBuddyConnectionState(email);
  const connectedUsers = connectionState.connectedBuddyIds
    .map((buddyId) => store.usersByEmail[buddyId])
    .filter(Boolean);

  return {
    streakDays: Math.max(1, connectedUsers.length + 1),
    members: [currentUser?.name || email, ...connectedUsers.map((user) => user.name)],
    lastCheckIn: connectionState.updatedAt,
  };
}
