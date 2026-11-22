import { describe, expect, it, vi } from 'vitest'
import { exportToPdfCompleto } from '../lib/export/pdf'

const save = vi.hoisted(() => vi.fn())

// jsPDF defines save() on each instance, so it is replaced after construction.
vi.mock('jspdf', async (importOriginal) => {
  const mod = await importOriginal<typeof import('jspdf')>()
  class TestPDF extends mod.jsPDF {
    constructor(...args: ConstructorParameters<typeof mod.jsPDF>) {
      super(...args)
      this.save = save
    }
  }
  return { ...mod, default: TestPDF, jsPDF: TestPDF }
})

describe('exportToPdfCompleto', () => {
  it('builds every section and saves the file', async () => {
    const projeto = { nome: 'Site', valor_total: 1000, valor_pago: 400, prazo: '2026-12-31', status: 'em_andamento' }
    const gasto = { data: '2026-06-01', descricao: 'Hosting', categoria: 'Infra', valor: 20, pago: true }
    const receita = { data: '2026-06-02', descricao: 'Sinal', origem: 'Cliente', valor: 400 }
    const sessao = { inicio: '2026-06-03T10:00:00', duracao_min: 90, projeto_nome: 'Site' }

    await exportToPdfCompleto([projeto] as never, [gasto] as never, [receita] as never, [sessao] as never, 'teste')

    expect(save).toHaveBeenCalledWith('devflow-relatorio-teste.pdf')
  })
})
