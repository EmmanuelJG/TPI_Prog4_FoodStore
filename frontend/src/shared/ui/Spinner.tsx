export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-stone-500">
      <span className="size-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
