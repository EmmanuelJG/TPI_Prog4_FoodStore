import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, error, id, className = '', ...props }: TextFieldProps) {
  const inputId = id ?? props.name
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-stone-300 focus:border-brand-500 focus:ring-brand-200'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
