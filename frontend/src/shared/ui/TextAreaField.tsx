import type { TextareaHTMLAttributes } from 'react'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
}

export function TextAreaField({ label, hint, id, className = '', ...props }: TextAreaFieldProps) {
  const areaId = id ?? props.name
  return (
    <div className="space-y-1">
      <label htmlFor={areaId} className="block text-sm font-medium text-stone-700">
        {label} {hint && <span className="font-normal text-stone-400">({hint})</span>}
      </label>
      <textarea
        id={areaId}
        rows={3}
        className={`block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${className}`}
        {...props}
      />
    </div>
  )
}
