import { useForm } from '@tanstack/react-form'
import { useActualizarProducto, useCrearProducto } from '@/features/catalog/adminHooks'
import type { Categoria, Producto } from '@/features/catalog/types'
import { handleApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { SelectField } from '@/shared/ui/SelectField'
import { TextAreaField } from '@/shared/ui/TextAreaField'
import { TextField } from '@/shared/ui/TextField'

interface ProductFormProps {
  /** Si viene un producto se edita; si no, se crea. */
  producto?: Producto
  categorias: Categoria[]
  onDone: () => void
}

export function ProductForm({ producto, categorias, onDone }: ProductFormProps) {
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const mutacion = producto ? actualizar : crear

  const form = useForm({
    defaultValues: {
      nombre: producto?.nombre ?? '',
      descripcion: producto?.descripcion ?? '',
      categoria_id: producto ? String(producto.categoria_id) : '',
      precio_base: producto ? String(producto.precio_base) : '',
      stock: producto ? String(producto.stock) : '0',
      imagen_url: producto?.imagen_url ?? '',
      disponible: producto?.disponible ?? true,
    },
    onSubmit: async ({ value }) => {
      const datos = {
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        categoria_id: Number(value.categoria_id),
        precio_base: Number(value.precio_base),
        stock: Number(value.stock),
        imagen_url: value.imagen_url.trim() || null,
        disponible: value.disponible,
      }
      if (producto) await actualizar.mutateAsync({ id: producto.id, ...datos })
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
            if (v.length > 150) return 'Máximo 150 caracteres'
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

      <form.Field
        name="categoria_id"
        validators={{ onChange: ({ value }) => (value ? undefined : 'Elegí una categoría') }}
      >
        {(field) => (
          <SelectField
            label="Categoría"
            name="categoria_id"
            placeholder="Elegí una categoría"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </SelectField>
        )}
      </form.Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field
          name="precio_base"
          validators={{
            onChange: ({ value }) => {
              if (value.trim() === '') return 'El precio es obligatorio'
              const n = Number(value)
              if (!Number.isFinite(n)) return 'Ingresá un número'
              if (n < 0) return 'No puede ser negativo'
              return undefined
            },
          }}
        >
          {(field) => (
            <TextField
              label="Precio"
              name="precio_base"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
            />
          )}
        </form.Field>

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
              label="Stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
            />
          )}
        </form.Field>
      </div>

      <form.Field name="imagen_url">
        {(field) => (
          <TextField
            label="URL de la imagen (opcional)"
            name="imagen_url"
            type="url"
            placeholder="https://…"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
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
              {producto ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
