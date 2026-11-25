import { describe, expect, it } from 'vitest'
import { assertDateOnly, assertNonNegativeAmount, recurringDueDate, statusAfterProjectPayment } from '../lib/financial-rules'

describe('financial data rules', () => {
  it('rejects negative and non-finite amounts but accepts an omitted optional value', () => {
    expect(() => assertNonNegativeAmount(-1, 'Valor')).toThrow()
    expect(() => assertNonNegativeAmount(Number.NaN, 'Valor')).toThrow()
    expect(() => assertNonNegativeAmount(undefined, 'Valor')).not.toThrow()
    expect(() => assertNonNegativeAmount(0, 'Valor')).not.toThrow()
  })

  it('rejects impossible calendar dates', () => {
    expect(() => assertDateOnly('2026-02-29', 'data')).toThrow()
    expect(() => assertDateOnly('2026-02-28', 'data')).not.toThrow()
  })

  it('updates payment states while preserving project execution states', () => {
    expect(statusAfterProjectPayment('pendente', 100, 40)).toBe('pago_parcial')
    expect(statusAfterProjectPayment('pago_parcial', 100, 100)).toBe('pago')
    expect(statusAfterProjectPayment('pago', 100, 0)).toBe('pendente')
    expect(statusAfterProjectPayment('em_andamento', 100, 100)).toBe('em_andamento')
    expect(statusAfterProjectPayment('concluido', 100, 0)).toBe('concluido')
    expect(statusAfterProjectPayment('cancelado', 100, 100)).toBe('cancelado')
  })

  it('clamps recurring dues to the last valid day of each month', () => {
    expect(recurringDueDate(31, '2026-01-31', new Date(2026, 1, 1)).getDate()).toBe(28)
    expect(recurringDueDate(31, '2026-01-31', new Date(2028, 1, 1)).getDate()).toBe(29)
    expect(recurringDueDate(null, '2026-01-15', new Date(2026, 5, 1)).getDate()).toBe(15)
  })
})
