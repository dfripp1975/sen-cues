export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-64 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>
      <div className="h-72 rounded-2xl bg-white ring-1 ring-slate-200" />
    </div>
  );
}
