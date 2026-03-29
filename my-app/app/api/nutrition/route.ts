import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { store } from "@/lib/store";
import { MARIA_CONTEXT } from "@/lib/patient";
import { SYSTEM_PROMPT } from "@/lib/prompt";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  /** The latest message from Maria */
  message: string;
  /**
   * Optional conversation history for multi-turn context.
   * Pass the full array of prior { role, content } pairs from your frontend.
   * If omitted the route falls back to single-turn mode.
   */
  history?: Pick<Message, "role" | "content">[];
}

// ─── POST /api/nutrition ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "message is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    // Build the messages array:
    // 1. System prompt (coaching persona + patient context)
    // 2. Prior conversation turns (if any)
    // 3. The new user message
    const messages: Message[] = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n${MARIA_CONTEXT}`,
      },
      // Sanitise history — only allow user/assistant roles to prevent prompt injection
      ...history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
      {
        role: "user",
        content: message.trim(),
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content ?? "";

    // Persist to the in-memory log (swap for DB write in production)
    const logEntry = store.append(message.trim(), reply);

    return NextResponse.json({
      reply,
      logEntry,
    });
  } catch (err) {
    console.error("[/api/nutrition] Error:", err);

    // Avoid leaking internal error details to the client
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// ─── GET /api/nutrition ───────────────────────────────────────────────────────
// Returns the full nutrition log. Wire up to a dashboard or remove if unneeded.

export async function GET() {
  return NextResponse.json({ log: store.getAll() });
}
