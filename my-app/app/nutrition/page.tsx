"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, ScanSearch, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { PageShell } from "@/components/pulse/page-shell";

type NutritionVerdict = "yes" | "sometimes" | "no";

type NutritionHistoryItem = {
  date: string;
  item: string;
  verdict: NutritionVerdict;
};

type NutritionAssessment = {
  foodName: string;
  ingredients: string[];
  verdict: NutritionVerdict;
  confidence: "high" | "medium" | "low";
  reason: string;
  recommendation: string;
  healthierSwap?: string;
  reply: string;
  recentHistory: NutritionHistoryItem[];
};

function getVerdictStyles(verdict: NutritionVerdict) {
  if (verdict === "yes") {
    return {
      badge: "bg-green-100 text-green-700",
      card: "border-green-200 bg-green-50",
      label: "Good fit today",
    };
  }

  if (verdict === "sometimes") {
    return {
      badge: "bg-amber-100 text-amber-700",
      card: "border-amber-200 bg-amber-50",
      label: "Okay with care",
    };
  }

  return {
    badge: "bg-red-100 text-red-700",
    card: "border-red-200 bg-red-50",
    label: "Not the best choice",
  };
}

export default function NutritionPage() {
  const [note, setNote] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assessment, setAssessment] = useState<NutritionAssessment | null>(null);
  const [recentHistory, setRecentHistory] = useState<NutritionHistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;

    async function loadRecentHistory() {
      try {
        const response = await fetch("/api/nutrition");
        const data = (await response.json()) as { recentHistory?: NutritionHistoryItem[] };

        if (!ignore && Array.isArray(data.recentHistory)) {
          setRecentHistory(data.recentHistory);
        }
      } catch {
        // Keep the page usable even if the history fetch fails.
      }
    }

    loadRecentHistory();

    return () => {
      ignore = true;
    };
  }, []);

  const convertFileToJpegDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onerror = () => reject(new Error("Unable to read that image."));
      fileReader.onload = () => {
        const source = typeof fileReader.result === "string" ? fileReader.result : "";

        if (!source) {
          reject(new Error("Unable to read that image."));
          return;
        }

        const image = new Image();
        image.onerror = () => reject(new Error("Unable to process that image."));
        image.onload = () => {
          const maxDimension = 1400;
          const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));

          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Unable to process that image."));
            return;
          }

          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.86));
        };
        image.src = source;
      };

      fileReader.readAsDataURL(file);
    });

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setLoading(true);
    setError("");

    convertFileToJpegDataUrl(file)
      .then((jpegDataUrl) => {
        setImagePreview(jpegDataUrl);
        setImageDataUrl(jpegDataUrl);
      })
      .catch((conversionError) => {
        setImagePreview("");
        setImageDataUrl("");
        setError(conversionError instanceof Error ? conversionError.message : "Unable to process that image.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const runFoodCheck = async () => {
    if (!imageDataUrl && !note.trim()) {
      setError("Upload a food photo or add a short food note first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/nutrition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: note,
          imageDataUrl,
        }),
      });

      const data = (await response.json()) as NutritionAssessment | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data && typeof data.error === "string" ? data.error : "Unable to analyze that food.");
      }

      setAssessment(data as NutritionAssessment);
      setRecentHistory((data as NutritionAssessment).recentHistory);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to analyze that food.");
    } finally {
      setLoading(false);
    }
  };

  const verdictStyles = assessment ? getVerdictStyles(assessment.verdict) : null;

  return (
    <PageShell title="Nutrition">
      <h1 className="mb-2 text-3xl font-bold">Your Grocery Guard</h1>
      <p className="mb-5 text-lg leading-relaxed text-muted-foreground">
        Upload a meal photo and Pulse will identify the food, guess the ingredients, and tell Maria whether it fits her
        rehab plan based on her recent food history.
      </p>

      <section className="mb-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Food Photo Upload</h2>
            <p className="text-sm text-muted-foreground">Snap a meal, snack, or packaged item label.</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />

        {imagePreview ? (
          <div className="mb-4 overflow-hidden rounded-2xl border border-border">
            <img src={imagePreview} alt="Food preview for nutrition analysis" className="h-72 w-full object-cover" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mb-4 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/10"
          >
            <UploadCloud className="h-8 w-8 text-primary" />
            <div>
              <p className="text-lg font-semibold text-foreground">Upload a food photo</p>
              <p className="text-sm text-muted-foreground">Tap to browse or open your camera.</p>
            </div>
          </button>
        )}

        {imagePreview && (
          <div className="mb-4 flex gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-muted"
            >
              Change photo
            </button>
            <button
              type="button"
              onClick={() => {
                setImagePreview("");
                setImageDataUrl("");
              }}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Remove
            </button>
          </div>
        )}

        <label className="mb-2 block text-sm font-semibold text-foreground">Optional note</label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Example: I want to eat this for lunch. Is it okay after rehab?"
          className="mb-4 min-h-28 w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
        />

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        <button
          type="button"
          onClick={runFoodCheck}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ScanSearch className="h-5 w-5" />}
          {loading ? "Analyzing food..." : "Check this food"}
        </button>
      </section>

      {assessment && verdictStyles && (
        <section className={`mb-5 rounded-2xl border-2 p-5 ${verdictStyles.card}`}>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${verdictStyles.badge}`}>{verdictStyles.label}</span>
              <h2 className="mt-2 text-2xl font-bold">{assessment.foodName}</h2>
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-muted-foreground">
              Confidence {assessment.confidence}
            </span>
          </div>

          <p className="mb-4 text-base leading-relaxed text-foreground/85">{assessment.reply}</p>

          <div className="mb-4 rounded-2xl border border-white/60 bg-white/70 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Why Pulse said this</p>
            <p className="mt-2 text-base leading-relaxed text-foreground">{assessment.reason}</p>
          </div>

          <div className="mb-4 rounded-2xl border border-white/60 bg-white/70 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recommendation</p>
            <p className="mt-2 text-base leading-relaxed text-foreground">{assessment.recommendation}</p>
            {assessment.healthierSwap && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Better swap: <span className="font-medium text-foreground">{assessment.healthierSwap}</span>
              </p>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Likely ingredients</p>
            <div className="flex flex-wrap gap-2">
              {assessment.ingredients.map((ingredient) => (
                <span
                  key={ingredient}
                  className="rounded-full border border-border bg-white px-3 py-1 text-sm text-secondary-foreground"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mb-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Recent food history</h3>
        </div>
        {recentHistory.length ? (
          <div className="space-y-3">
            {recentHistory.map((entry) => {
              const styles = getVerdictStyles(entry.verdict);
              return (
                <div key={`${entry.date}-${entry.item}`} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/60 px-4 py-3">
                  <div>
                    <p className="font-semibold text-foreground">{entry.item}</p>
                    <p className="text-sm text-muted-foreground">{entry.date}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${styles.badge}`}>{styles.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-base text-muted-foreground">No prior food checks yet. Your next scan will start the history.</p>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
        <p className="text-base leading-relaxed text-amber-800">
          <strong>Heart-safe reminder:</strong> The AI can help identify foods and estimate ingredients, but label details,
          sodium, and portion size still matter. Maria should follow her care team&apos;s dietary guidance first.
        </p>
      </div>
    </PageShell>
  );
}
