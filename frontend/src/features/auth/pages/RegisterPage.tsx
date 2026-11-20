import { useForm } from '@tanstack/react-form'
import { Link } from 'react-router-dom'
import { handleApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'
import { useRegister } from '../hooks'
import { email, fullName, password, username } from '../validators'

export default function RegisterPage() {
  const register = useRegister()

  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '', confirm: '' },
    onSubmit: async ({ value }) => {
      // Tras registrarse se inicia sesión y PublicOnlyRoute redirige.
      await register.mutateAsync({
        username: value.username.trim(),
        full_name: value.full_name.trim(),
        email: value.email.trim(),
        password: value.password,
      })
    },
  })

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Creá tu cuenta</h1>
        <p className="mt-1 text-sm text-stone-500">Es gratis y toma menos de un minuto.</p>

        <form
          noValidate
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            register.reset()
            form.handleSubmit().catch(() => undefined)
          }}
        >
          {register.isError && <Alert>{handleApiError(register.error)}</Alert>}

          <form.Field name="full_name" validators={{ onChange: fullName }}>
            {(field) => (
              <TextField
                label="Nombre completo"
                name="full_name"
                autoComplete="name"
                autoFocus
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              />
            )}
          </form.Field>

          <form.Field name="username" validators={{ onChange: username }}>
            {(field) => (
              <TextField
                label="Usuario"
                name="username"
                autoComplete="username"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              />
            )}
          </form.Field>

          <form.Field name="email" validators={{ onChange: email }}>
            {(field) => (
              <TextField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              />
            )}
          </form.Field>

          <form.Field name="password" validators={{ onChange: password }}>
            {(field) => (
              <TextField
                label="Contraseña"
                name="password"
                type="password"
                autoComplete="new-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              />
            )}
          </form.Field>

          <form.Field
            name="confirm"
            validators={{
              onChangeListenTo: ['password'],
              onChange: ({ value, fieldApi }) =>
                value === fieldApi.form.getFieldValue('password')
                  ? undefined
                  : 'Las contraseñas no coinciden',
            }}
          >
            {(field) => (
              <TextField
                label="Repetir contraseña"
                name="confirm"
                type="password"
                autoComplete="new-password"
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
                Crear cuenta
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  )
}
