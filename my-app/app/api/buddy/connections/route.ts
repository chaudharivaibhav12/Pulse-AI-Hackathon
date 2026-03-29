import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAvailableBuddyUsers,
  getBuddyConnectionState,
  getRecoveryCircle,
  registerUser,
  setBuddyConnectionState,
} from "@/lib/store";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  registerUser({
    email,
    name: session.user?.name,
    image: session.user?.image,
  });

  return NextResponse.json({
    buddies: getAvailableBuddyUsers(email),
    connectionState: getBuddyConnectionState(email),
    recoveryCircle: getRecoveryCircle(email),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { buddyId, type, value } = await req.json();

  if (typeof buddyId !== "string" || !buddyId) {
    return NextResponse.json({ error: "buddyId is required" }, { status: 400 });
  }

  if (type !== "connected" && type !== "planned") {
    return NextResponse.json({ error: "type must be connected or planned" }, { status: 400 });
  }

  if (typeof value !== "boolean") {
    return NextResponse.json({ error: "value must be boolean" }, { status: 400 });
  }

  registerUser({
    email,
    name: session.user?.name,
    image: session.user?.image,
  });

  const availableBuddy = getAvailableBuddyUsers(email).find((user) => user.id === buddyId);

  if (!availableBuddy) {
    return NextResponse.json({ error: "Buddy not found" }, { status: 404 });
  }

  const nextState = setBuddyConnectionState(email, buddyId, type, value);

  return NextResponse.json({
    buddyId,
    buddies: getAvailableBuddyUsers(email),
    connectionState: nextState,
    recoveryCircle: getRecoveryCircle(email),
  });
}
