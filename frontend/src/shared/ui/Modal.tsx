import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Diálogo modal sobre <dialog>. El contenido se monta solo mientras está
 * abierto: así los formularios que contiene arrancan limpios en cada apertura.
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        // Clic en el fondo oscuro (el propio <dialog>) cierra el modal.
        if (e.target === ref.current) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl p-0 shadow-xl backdrop:bg-stone-900/50"
    >
      {open && (
        <div className="max-h-[85vh] space-y-5 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-md px-2 text-xl leading-none text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
