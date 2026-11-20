import type { SelectHTMLAttributes } from 'react'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  placeholder?: string
}

export function SelectField({
  label,
  error,
  id,
  placeholder,
  className = '',
  children,
  ...props
}: SelectFieldProps) {
  const selectId = id ?? props.name
  return (
    <div className="space-y-1">
      <label htmlFor={selectId} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-stone-300 focus:border-brand-500 focus:ring-brand-200'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
