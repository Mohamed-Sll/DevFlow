import { describe, expect, it } from 'vitest'
import { parseBackup } from '../lib/data/backup'

function validBackup() {
  return {
    app: 'devflow-web',
    version: 1,
    exportedAt: '2026-11-25T10:00:00.000Z',
    data: {
      clientes: [{ id: 1, nome: 'Cliente', email: null, telefone: null, empresa: null }],
      projetos: [{ id: 1, cliente_id: 1, titulo: 'Projeto', descricao: null, tipo: null, valor_total: 100, valor_pago: 0, status: 'pendente', prazo: '2026-12-01', repo_url: null, staging_url: null, notas: null }],
      gastos: [{ id: 1, descricao: 'Domínio', valor: 10, data: '2026-11-01', categoria_nome: 'Software', recorrente: 0, dia_vencimento: null, metodo: null, pago: 1, notas: null }],
      receitas: [{ id: 1, pagamento_id: 1, projeto_id: 1, descricao: 'Parcela', valor: 20, data: '2026-11-02', origem: null }],
      investimentos: [{ id: 1, nome: 'Reserva', tipo: 'Poupança', meta_valor: 200, meta_data: null, notas: null, ativo: 1 }],
      aportes: [{ id: 1, investimento_id: 1, valor: 20, data: '2026-11-03', tipo: 'aporte', notas: null }],
      tempo_projeto: [{ id: 1, projeto_id: 1, inicio: '2026-11-03T10:00:00.000Z', fim: null, duracao_min: null, descricao: null }],
      configuracoes: [{ chave: 'moeda', valor: 'CVE' }],
      pagamentos: [{ id: 1, projeto_id: 1, valor: 20, data: '2026-11-02', metodo: null }],
    },
  }
}

describe('parseBackup', () => {
  it('accepts a compatible backup with consistent relations', () => {
    expect(parseBackup(validBackup()).data.projetos).toHaveLength(1)
  })

  it('rejects impossible dates and negative financial values', () => {
    const invalidDate = validBackup()
    Reflect.set(invalidDate.data.gastos[0], 'data', '2026-02-30')
    expect(() => parseBackup(invalidDate)).toThrow('gastos')

    const negativeAmount = validBackup()
    Reflect.set(negativeAmount.data.receitas[0], 'valor', -1)
    expect(() => parseBackup(negativeAmount)).toThrow('receitas')
  })

  it('rejects references to missing local records', () => {
    const orphan = validBackup()
    Reflect.set(orphan.data.projetos[0], 'cliente_id', 999)
    expect(() => parseBackup(orphan)).toThrow('clientes inexistentes')
  })

  it('rejects duplicate identifiers before restore can replace local data', () => {
    const duplicate = validBackup()
    duplicate.data.clientes.push({ ...duplicate.data.clientes[0] })
    expect(() => parseBackup(duplicate)).toThrow('identificadores repetidos')
  })
})
