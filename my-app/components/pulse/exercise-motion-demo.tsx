import type { ExerciseAnimationHint } from "@/lib/exercise-motion";

type ExerciseMotionDemoProps = {
  title: string;
  hint: ExerciseAnimationHint;
  durationSeconds?: number;
};

export function ExerciseMotionDemo({
  title,
  hint,
  durationSeconds = 5,
}: ExerciseMotionDemoProps) {
  return (
    <div className="exercise-demo relative overflow-hidden rounded-[28px] border border-white/15 bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.34),_rgba(15,23,42,0.92)_62%)] aspect-video">
      <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle,_rgba(255,255,255,0.18),_transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,_rgba(15,23,42,0)_0%,_rgba(15,23,42,0.72)_40%,_rgba(8,15,32,0.95)_100%)]" />
      <div className="exercise-demo__spark exercise-demo__spark--1" />
      <div className="exercise-demo__spark exercise-demo__spark--2" />
      <div className="exercise-demo__spark exercise-demo__spark--3" />

      <div className={`exercise-demo__scene exercise-demo__scene--${hint}`}>
        <div className="exercise-demo__halo" />
        <div className="exercise-demo__figure" style={{ ["--exercise-loop" as string]: `${durationSeconds}s` }}>
          <div className="exercise-demo__head" />
          <div className="exercise-demo__torso" />
          <div className="exercise-demo__arm exercise-demo__arm--left" />
          <div className="exercise-demo__arm exercise-demo__arm--right" />
          <div className="exercise-demo__leg exercise-demo__leg--left" />
          <div className="exercise-demo__leg exercise-demo__leg--right" />
        </div>
      </div>

      <div className="absolute left-4 top-4 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-white/75 uppercase">
        5 sec demo
      </div>
      <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-12 text-white">
        <p className="text-xl font-semibold leading-tight">{title}</p>
        <p className="mt-1 text-sm text-white/70">Looping movement guide for Maria</p>
      </div>
    </div>
  );
}
