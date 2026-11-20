const moneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})

export const formatMoney = (valor: number): string => moneda.format(valor)

/**
 * El backend guarda las fechas en UTC pero las serializa sin zona
 * ("2026-11-15T18:29:52"). Sin sufijo el navegador las leería como hora local
 * y mostraría el pedido 3 horas corrido, así que se fuerza UTC.
 */
export function parseFechaApi(iso: string): Date {
  const tieneZona = /(Z|[+-]\d{2}:?\d{2})$/.test(iso)
  return new Date(tieneZona ? iso : `${iso}Z`)
}

export function formatFecha(iso: string): string {
  return parseFechaApi(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    // Formato de 24 horas ("19:20"), sin "p. m." ni "24:05" a medianoche.
    hourCycle: 'h23',
  })
}
