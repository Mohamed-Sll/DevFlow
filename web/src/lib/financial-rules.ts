const EXECUTION_STATUSES = new Set(['em_andamento', 'concluido', 'cancelado'])
const PAYMENT_STATUSES = new Set(['pendente', 'pago_parcial', 'pago'])

/** Mantém o estado de execução do projeto separado dos efeitos de um pagamento. */
export function statusAfterProjectPayment(
  currentStatus: string | null | undefined,
  totalValue: number | null | undefined,
  paidValue: number,
) {
  const current = currentStatus?.toLowerCase() ?? 'pendente'
  if (EXECUTION_STATUSES.has(current)) return current
  if (!PAYMENT_STATUSES.has(current) || !totalValue || totalValue <= 0) return current
  if (paidValue >= totalValue) return 'pago'
  if (paidValue > 0) return 'pago_parcial'
  return 'pendente'
}

export function assertNonNegativeAmount(value: number | null | undefined, label: string) {
  if (value !== null && value !== undefined && (!Number.isFinite(value) || value < 0)) {
    throw new Error(`${label} deve ser um número igual ou superior a zero.`)
  }
}

export function assertDateOnly(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Informe uma data válida para ${label}.`)
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Informe uma data válida para ${label}.`)
  }
}

export function recurringDueDate(dueDay: number | null | undefined, fallbackDate: string, reference: Date) {
  const daysInMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate()
  const fallbackDay = Number(fallbackDate.slice(8, 10)) || 1
  const requestedDay = dueDay ?? fallbackDay
  const safeDay = Math.min(Math.max(Math.trunc(requestedDay), 1), daysInMonth)
  return new Date(reference.getFullYear(), reference.getMonth(), safeDay)
}
