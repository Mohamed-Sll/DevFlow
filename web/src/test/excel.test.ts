import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Aporte, Investimento } from '../lib/types'

const download = vi.hoisted(() => vi.fn())
vi.mock('../lib/download', () => ({ downloadBlob: download }))

describe('complete Excel report', () => {
  beforeEach(() => download.mockReset())

  it('keeps investment data separate and includes work-session details', async () => {
    const { exportToXlsxCompleto } = await import('../lib/export/excel')
    const investment: Investimento = {
      id: 1, nome: 'Reserve', tipo: 'Savings', meta_valor: 100, meta_data: null, notas: null, ativo: 1, criado_em: null,
    }
    const contribution: Aporte = {
      id: 1, investimento_id: 1, valor: 20, data: '2026-11-01', tipo: 'aporte', notas: null, criado_em: null,
      investimentos: { id: 1, nome: 'Reserve', tipo: 'Savings' },
    }

    await exportToXlsxCompleto([], [], [], [], [investment], [contribution], 'test')

    expect(download).toHaveBeenCalledOnce()
    const blob = download.mock.calls[0][1] as Blob
    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(Buffer.from(await blob.arrayBuffer()))

    expect(workbook.worksheets.map((sheet) => sheet.name)).toContain('Investimentos')
    expect(workbook.worksheets.map((sheet) => sheet.name)).toContain('Movimentos de Investimento')
    expect(workbook.worksheets.map((sheet) => sheet.name)).toContain('Sessões do Timer')
    expect(workbook.getWorksheet('Investimentos')?.getCell('A2').value).toBe('Reserve')
    expect(workbook.getWorksheet('Lucro e Prejuízo')?.getCell('B4').value).toBe(0)
  })
})
