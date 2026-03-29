export type ExerciseAnimationHint =
  | "walk"
  | "march"
  | "arm-circles"
  | "stretch"
  | "breathing"
  | "step-touch"
  | "recovery";

export function slugifyExerciseName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function inferAnimationHint(name: string, details = ""): ExerciseAnimationHint {
  const haystack = `${name} ${details}`.toLowerCase();

  if (haystack.includes("breath")) {
    return "breathing";
  }

  if (haystack.includes("arm circle") || haystack.includes("shoulder roll") || haystack.includes("reach")) {
    return "arm-circles";
  }

  if (
    haystack.includes("stretch") ||
    haystack.includes("calf") ||
    haystack.includes("hamstring") ||
    haystack.includes("cool down")
  ) {
    return "stretch";
  }

  if (haystack.includes("march")) {
    return "march";
  }

  if (haystack.includes("step touch") || haystack.includes("side step")) {
    return "step-touch";
  }

  if (haystack.includes("walk") || haystack.includes("walking") || haystack.includes("treadmill")) {
    return "walk";
  }

  return "recovery";
}
