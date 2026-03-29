"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight,
  Clock,
  FileText,
  Flame,
  LoaderCircle,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/pulse/page-shell";
import { ExerciseMotionDemo } from "@/components/pulse/exercise-motion-demo";
import type { ExerciseAnimationHint } from "@/lib/exercise-motion";

type ExerciseClip = {
  name: string;
  details: string;
  durationLabel: string;
  videoId: string;
  animationHint: ExerciseAnimationHint;
  demoDurationSeconds: number;
};

type ExerciseSessionResponse = {
  reply: string;
  planTitle: string;
  planSummary: string;
  sourcePdf: string;
  extractedExerciseNames: string[];
  exercises: ExerciseClip[];
  metrics: {
    heartRate: number;
    intensityAdjusted: boolean;
  };
};

const fearEmojis = ["😊", "🙂", "😐", "😟", "😟", "😕", "😰", "😰", "😱", "😱"];

function getSessionTone(fearScore: number) {
  if (fearScore >= 7) {
    return {
      color: "bg-green-50 border-green-200",
      badge: "bg-green-100 text-green-700",
      intensity: "Very Light",
    };
  }

  if (fearScore >= 4) {
    return {
      color: "bg-amber-50 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      intensity: "Light",
    };
  }

  return {
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    intensity: "Light-Moderate",
  };
}

export default function ExercisePage() {
  const [fearScore, setFearScore] = useState(4);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState<ExerciseSessionResponse | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/exercise", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fearScore,
            message: "Build today's routine from Exercise_Routine.pdf.",
          }),
          signal: controller.signal,
        });

        const data = (await response.json()) as ExerciseSessionResponse | { error?: string };

        if (!response.ok) {
          throw new Error("error" in data && typeof data.error === "string" ? data.error : "Unable to load exercise plan.");
        }

        setSession(data as ExerciseSessionResponse);
        setActiveExerciseIndex(0);
        setStarted(false);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Unable to load exercise plan.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [fearScore]);

  useEffect(() => {
    if (!started || !session?.exercises.length) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveExerciseIndex((currentIndex) => (currentIndex + 1) % session.exercises.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [started, session?.exercises.length]);

  const sessionTone = getSessionTone(fearScore);
  const currentExercise = session?.exercises[activeExerciseIndex] ?? null;

  return (
    <PageShell title="Exercise">
      <h1 className="mb-2 text-3xl font-bold">Your Home Workout</h1>
      <p className="mb-5 text-base text-muted-foreground">
        We pull today&apos;s moves from your uploaded PDF and turn them into short follow-along demos.
      </p>

      <section className="mb-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-xl font-semibold">Fear Check</h2>
        <p className="mb-4 text-base leading-relaxed text-muted-foreground">
          How nervous do you feel about moving today?
        </p>
        <div className="mb-3 flex items-center gap-3">
          <span aria-hidden="true" className="text-3xl">
            😊
          </span>
          <input
            type="range"
            min={1}
            max={10}
            value={fearScore}
            onChange={(event) => setFearScore(Number(event.target.value))}
            aria-label="Fear and anxiety level from 1 calm to 10 very nervous"
            className="h-3 flex-1 cursor-pointer accent-primary"
          />
          <span aria-hidden="true" className="text-3xl">
            😰
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Calm to Very Nervous</p>
          <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
            <span className="text-2xl">{fearEmojis[fearScore - 1]}</span>
            <span className="text-xl font-bold text-foreground">{fearScore}/10</span>
          </div>
        </div>
        {fearScore >= 7 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-base font-medium text-amber-800">
              We&apos;ll keep today extra gentle and only show the simplest moves from the routine.
            </p>
          </div>
        )}
      </section>

      <section className={`mb-5 rounded-2xl border-2 p-5 ${sessionTone.color}`}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${sessionTone.badge}`}>
              PDF Driven Plan
            </span>
            <h2 className="mt-2 text-2xl font-bold">
              {session?.planTitle ?? (loading ? "Building your routine..." : "Exercise session")}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {session?.exercises.length ? `${session.exercises.length * 5} sec total demos` : "Short clips"}
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4" />
              {sessionTone.intensity}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-base text-foreground/80">
            <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
            Reading Exercise_Routine.pdf and preparing the routine.
          </div>
        ) : error ? (
          <p className="text-base text-destructive">{error}</p>
        ) : (
          <>
            <p className="mb-4 text-base leading-relaxed text-foreground/80">{session?.planSummary}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1">
                <FileText className="h-4 w-4" />
                {session?.sourcePdf}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1">
                <Sparkles className="h-4 w-4" />
                Heart rate {session?.metrics.heartRate} BPM
              </span>
            </div>
          </>
        )}
      </section>

      <section className="mb-5">
        {currentExercise ? (
          <ExerciseMotionDemo
            title={currentExercise.name}
            hint={currentExercise.animationHint}
            durationSeconds={currentExercise.demoDurationSeconds}
          />
        ) : (
          <div className="aspect-video rounded-[28px] border border-border bg-slate-950/95 p-6 text-white">
            <div className="flex h-full items-center justify-center text-center text-white/70">
              {loading ? "Preparing animated demo..." : "No exercise demo available yet."}
            </div>
          </div>
        )}
      </section>

      {!loading && currentExercise && (
        <section className="mb-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Now showing</p>
              <h3 className="text-2xl font-bold">{currentExercise.name}</h3>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              {currentExercise.durationLabel}
            </span>
          </div>
          <p className="text-base leading-relaxed text-muted-foreground">{currentExercise.details}</p>
        </section>
      )}

      {!loading && session?.reply && (
        <section className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-base leading-relaxed text-blue-900">{session.reply}</p>
        </section>
      )}

      {!started && session?.exercises.length ? (
        <button
          onClick={() => setStarted(true)}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-xl font-bold text-white shadow-md transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          <Play className="h-6 w-6 fill-white" />
          Start Demo Playlist
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : session?.exercises.length ? (
        <button
          onClick={() => setStarted(false)}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-5 text-xl font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98]"
        >
          Pause Playlist
        </button>
      ) : null}

      {!!session?.exercises.length && (
        <section className="mb-5 space-y-3">
          {session.exercises.map((exercise, index) => (
            <button
              key={exercise.videoId}
              type="button"
              onClick={() => {
                setActiveExerciseIndex(index);
                setStarted(false);
              }}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                activeExerciseIndex === index
                  ? "border-primary bg-primary/5"
                  : "border-border bg-white hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{exercise.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{exercise.details}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-secondary-foreground">
                  Clip {index + 1}
                </span>
              </div>
            </button>
          ))}
        </section>
      )}

      {!!session?.extractedExerciseNames.length && (
        <section className="mb-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Exercises detected in the PDF</h3>
          <div className="flex flex-wrap gap-2">
            {session.extractedExerciseNames.map((exerciseName) => (
              <span
                key={exerciseName}
                className="rounded-full border border-border bg-secondary px-3 py-1 text-sm text-secondary-foreground"
              >
                {exerciseName}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
        <p className="text-base leading-relaxed text-amber-800">
          <strong>Safety first:</strong> These demos are short visual guides only. Maria should stop right away for chest pain,
          dizziness, or shortness of breath and follow her care team&apos;s advice.
        </p>
      </div>
    </PageShell>
  );
}
