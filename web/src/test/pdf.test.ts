import { describe, expect, it, vi } from 'vitest'
import { exportToPdfCompleto } from '../lib/export/pdf'
import type { Gasto, Projeto, Receita, TempoProjeto } from '../lib/types'

const save = vi.hoisted(() => vi.fn())
const lastDocument = vi.hoisted(() => ({ current: null as unknown }))

// jsPDF defines save() on each instance, so it is replaced after construction.
vi.mock('jspdf', async (importOriginal) => {
  const mod = await importOriginal<typeof import('jspdf')>()
  class TestPDF extends mod.jsPDF {
    constructor(...args: ConstructorParameters<typeof mod.jsPDF>) {
      super(...args)
      lastDocument.current = this
      this.save = save
    }
  }
  return { ...mod, default: TestPDF, jsPDF: TestPDF }
})

describe('exportToPdfCompleto', () => {
  it('builds every section and saves the file', async () => {
    const projeto: Projeto = {
      id: 1,
      cliente_id: 1,
      titulo: 'Website project',
      descricao: null,
      tipo: null,
      valor_total: 1000,
      valor_pago: 400,
      status: 'em_andamento',
      prazo: '2026-12-31',
      repo_url: null,
      staging_url: null,
      notas: null,
      criado_em: null,
      atualizado_em: null,
      clientes: { id: 1, nome: 'Acme' },
    }
    const gasto: Gasto = {
      id: 1,
      descricao: 'Hosting subscription',
      valor: 20,
      data: '2026-06-01',
      categoria_nome: 'Infrastructure',
      recorrente: 0,
      dia_vencimento: null,
      metodo: 'card',
      pago: 1,
      notas: null,
      criado_em: null,
    }
    const receita: Receita = {
      id: 1,
      projeto_id: 1,
      descricao: 'Project deposit',
      valor: 400,
      data: '2026-06-02',
      origem: 'Acme',
      criado_em: null,
      projetos: { id: 1, titulo: 'Website project' },
    }
    const sessao: TempoProjeto = {
      id: 1,
      projeto_id: 1,
      inicio: '2026-06-03T10:00:00',
      fim: '2026-06-03T11:30:00',
      duracao_min: 90,
      descricao: 'Implementation',
      criado_em: null,
      projetos: { id: 1, titulo: 'Website project' },
    }

    await exportToPdfCompleto([projeto], [gasto], [receita], [sessao], 'test')

    expect(save).toHaveBeenCalledWith('devflow-relatorio-test.pdf')
    const pdf = (lastDocument.current as { output: () => string }).output()
    expect(pdf).toContain('Resumo Financeiro')
    expect(pdf).toContain('Website project')
    expect(pdf).toContain('Hosting subscription')
    expect(pdf).toContain('Project deposit')
  })
})
