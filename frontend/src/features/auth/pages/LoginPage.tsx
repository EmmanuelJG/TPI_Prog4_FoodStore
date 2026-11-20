import { useForm } from '@tanstack/react-form'
import { Link } from 'react-router-dom'
import { handleApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'
import { useLogin } from '../hooks'
import { required } from '../validators'

export default function LoginPage() {
  const login = useLogin()

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      // La redirección la hace PublicOnlyRoute cuando el store queda autenticado.
      await login.mutateAsync({ username: value.username.trim(), password: value.password })
    },
  })

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Ingresá a tu cuenta</h1>
        <p className="mt-1 text-sm text-stone-500">Hacé tu pedido en pocos pasos.</p>

        <form
          noValidate
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            login.reset()
            form.handleSubmit().catch(() => undefined)
          }}
        >
          {login.isError && <Alert>{handleApiError(login.error)}</Alert>}

          <form.Field name="username" validators={{ onChange: required('Ingresá tu usuario') }}>
            {(field) => (
              <TextField
                label="Usuario"
                name="username"
                autoComplete="username"
                autoFocus
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              />
            )}
          </form.Field>

          <form.Field name="password" validators={{ onChange: required('Ingresá tu contraseña') }}>
            {(field) => (
              <TextField
                label="Contraseña"
                name="password"
                type="password"
                autoComplete="current-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              />
            )}
          </form.Field>

          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Ingresar
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
