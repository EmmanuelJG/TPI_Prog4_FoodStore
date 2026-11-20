import { useForm } from '@tanstack/react-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { handleApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'
import { formatMoney } from '@/shared/utils/format'
import { selectCartTotal, useCartStore } from '@/stores/cartStore'
import { useCrearPedido } from '../hooks'
import { FORMA_PAGO_LABEL, type FormaPago } from '../types'

const FORMAS: FormaPago[] = ['EFECTIVO', 'TRANSFERENCIA']

export default function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const total = useCartStore(selectCartTotal)
  const clearCart = useCartStore((s) => s.clear)
  const crear = useCrearPedido()

  const form = useForm({
    defaultValues: {
      forma_pago: 'EFECTIVO' as FormaPago,
      direccion_entrega: '',
      notas: '',
    },
    onSubmit: async ({ value }) => {
      const pedido = await crear.mutateAsync({
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        forma_pago: value.forma_pago,
        direccion_entrega: value.direccion_entrega.trim(),
        notas: value.notas.trim() || null,
      })
      clearCart()
      navigate('/pedidos', { replace: true, state: { nuevoPedido: pedido.id } })
    },
  })

  // Con el carrito vacío no hay nada que confirmar (salvo mientras se envía,
  // porque el carrito se vacía justo antes de navegar).
  if (items.length === 0 && !crear.isSuccess) return <Navigate to="/carrito" replace />

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Confirmar pedido</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <form
          noValidate
          className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            crear.reset()
            form.handleSubmit().catch(() => undefined)
          }}
        >
          {crear.isError && <Alert>{handleApiError(crear.error)}</Alert>}

          <form.Field
            name="direccion_entrega"
            validators={{
              onChange: ({ value }) => {
                const v = value.trim()
                if (!v) return 'La dirección es obligatoria'
                if (v.length < 5) return 'Mínimo 5 caracteres'
                if (v.length > 200) return 'Máximo 200 caracteres'
                return undefined
              },
            }}
          >
            {(field) => (
              <TextField
                label="Dirección de entrega"
                name="direccion_entrega"
                autoComplete="street-address"
                placeholder="Calle, número, piso/depto"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              />
            )}
          </form.Field>

          <form.Field name="forma_pago">
            {(field) => (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-stone-700">Forma de pago</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FORMAS.map((forma) => {
                    const activa = field.state.value === forma
                    return (
                      <label
                        key={forma}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                          activa
                            ? 'border-brand-500 bg-brand-50 text-brand-800'
                            : 'border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="forma_pago"
                          value={forma}
                          checked={activa}
                          onChange={() => field.handleChange(forma)}
                          className="accent-brand-600"
                        />
                        {FORMA_PAGO_LABEL[forma]}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            )}
          </form.Field>

          <form.Field name="notas">
            {(field) => (
              <div className="space-y-1">
                <label htmlFor="notas" className="block text-sm font-medium text-stone-700">
                  Notas <span className="font-normal text-stone-400">(opcional)</span>
                </label>
                <textarea
                  id="notas"
                  name="notas"
                  rows={3}
                  placeholder="Ej.: sin cebolla, tocar timbre 2B"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Confirmar pedido · {formatMoney(total)}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <aside className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold">Resumen</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.producto_id} className="flex justify-between gap-3">
                <span className="text-stone-600">
                  {i.cantidad} × {i.nombre}
                </span>
                <span className="font-medium tabular-nums">{formatMoney(i.precio * i.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
          <p className="text-xs text-stone-500">
            El precio final se confirma al crear el pedido, con los valores vigentes del menú.
          </p>
        </aside>
      </div>
    </div>
  )
}
