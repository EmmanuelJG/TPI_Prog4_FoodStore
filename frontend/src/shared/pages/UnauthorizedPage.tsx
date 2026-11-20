import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-bold text-brand-600">403</p>
      <h1 className="mt-4 text-2xl font-bold">No tenés permisos</h1>
      <p className="mt-2 text-stone-600">Esta sección no está disponible para tu rol.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
