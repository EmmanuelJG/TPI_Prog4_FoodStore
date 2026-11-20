import { useForm } from '@tanstack/react-form'
import { useActualizarStock } from '@/features/catalog/adminHooks'
import type { Producto } from '@/features/catalog/types'
import { handleApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'

export function StockForm({ producto, onDone }: { producto: Producto; onDone: () => void }) {
  const actualizar = useActualizarStock()

  const form = useForm({
    defaultValues: { stock: String(producto.stock), disponible: producto.disponible },
    onSubmit: async ({ value }) => {
      await actualizar.mutateAsync({
        id: producto.id,
        stock: Number(value.stock),
        disponible: value.disponible,
      })
      onDone()
    },
  })

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        actualizar.reset()
        form.handleSubmit().catch(() => undefined)
      }}
    >
      <p className="text-sm text-stone-600">
        {producto.nombre} · stock actual: <strong>{producto.stock}</strong>
      </p>

      {actualizar.isError && <Alert>{handleApiError(actualizar.error)}</Alert>}

      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) => {
            if (value.trim() === '') return 'El stock es obligatorio'
            const n = Number(value)
            if (!Number.isInteger(n)) return 'Debe ser un entero'
            if (n < 0) return 'No puede ser negativo'
            return undefined
          },
        }}
      >
        {(field) => (
          <TextField
            label="Nuevo stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            autoFocus
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
              className="size-4 accent-brand-600"
            />
            Disponible para la venta
          </label>
        )}
      </form.Field>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" loading={isSubmitting}>
              Guardar stock
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
