import { useForm } from '@tanstack/react-form'
import { useActualizarCategoria, useCrearCategoria } from '@/features/catalog/adminHooks'
import type { Categoria } from '@/features/catalog/types'
import { handleApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { TextAreaField } from '@/shared/ui/TextAreaField'
import { TextField } from '@/shared/ui/TextField'

export function CategoryForm({ categoria, onDone }: { categoria?: Categoria; onDone: () => void }) {
  const crear = useCrearCategoria()
  const actualizar = useActualizarCategoria()
  const mutacion = categoria ? actualizar : crear

  const form = useForm({
    defaultValues: { nombre: categoria?.nombre ?? '', descripcion: categoria?.descripcion ?? '' },
    onSubmit: async ({ value }) => {
      const datos = { nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null }
      if (categoria) await actualizar.mutateAsync({ id: categoria.id, ...datos })
      else await crear.mutateAsync(datos)
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
        mutacion.reset()
        form.handleSubmit().catch(() => undefined)
      }}
    >
      {mutacion.isError && <Alert>{handleApiError(mutacion.error)}</Alert>}

      <form.Field
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            const v = value.trim()
            if (!v) return 'El nombre es obligatorio'
            if (v.length < 2) return 'Mínimo 2 caracteres'
            if (v.length > 100) return 'Máximo 100 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <TextField
            label="Nombre"
            name="nombre"
            autoFocus
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field name="descripcion">
        {(field) => (
          <TextAreaField
            label="Descripción"
            hint="opcional"
            name="descripcion"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" loading={isSubmitting}>
              {categoria ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
