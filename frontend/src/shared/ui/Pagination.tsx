import { Button } from './Button'

interface PaginationProps {
  page: number
  pages: number
  onChange: (page: number) => void
}

export function Pagination({ page, pages, onChange }: PaginationProps) {
  if (pages <= 1) return null
  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-4 pt-6">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </Button>
      <span className="text-sm text-stone-600">
        Página {page} de {pages}
      </span>
      <Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Siguiente
      </Button>
    </nav>
  )
}
