export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
          <span className="text-2xl">🏠</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
          HomeBase
        </p>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
      </div>
    </div>
  );
}
