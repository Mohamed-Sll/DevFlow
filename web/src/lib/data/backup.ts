import {
  db,
  type DbAporte,
  type DbCliente,
  type DbConfiguracao,
  type DbGasto,
  type DbInvestimento,
  type DbPagamento,
  type DbProjeto,
  type DbReceita,
  type DbTempoProjeto,
} from './db'

const BACKUP_VERSION = 1
const BACKUP_APP = 'devflow-web'

const backupTables = [
  'clientes',
  'projetos',
  'gastos',
  'receitas',
  'investimentos',
  'aportes',
  'tempo_projeto',
  'configuracoes',
  'pagamentos',
] as const

export interface DevFlowBackup {
  app: typeof BACKUP_APP
  version: typeof BACKUP_VERSION
  exportedAt: string
  data: {
    clientes: DbCliente[]
    projetos: DbProjeto[]
    gastos: DbGasto[]
    receitas: DbReceita[]
    investimentos: DbInvestimento[]
    aportes: DbAporte[]
    tempo_projeto: DbTempoProjeto[]
    configuracoes: DbConfiguracao[]
    pagamentos: DbPagamento[]
  }
}

export async function createBackup(): Promise<DevFlowBackup> {
  const [clientes, projetos, gastos, receitas, investimentos, aportes, tempo_projeto, configuracoes, pagamentos] =
    await db.transaction(
      'r',
      [
        db.clientes,
        db.projetos,
        db.gastos,
        db.receitas,
        db.investimentos,
        db.aportes,
        db.tempo_projeto,
        db.configuracoes,
        db.pagamentos,
      ],
      () =>
        Promise.all([
          db.clientes.toArray(),
          db.projetos.toArray(),
          db.gastos.toArray(),
          db.receitas.toArray(),
          db.investimentos.toArray(),
          db.aportes.toArray(),
          db.tempo_projeto.toArray(),
          db.configuracoes.toArray(),
          db.pagamentos.toArray(),
        ]),
    )

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      clientes,
      projetos,
      gastos,
      receitas,
      investimentos,
      aportes,
      tempo_projeto,
      configuracoes,
      pagamentos,
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasId(row: Record<string, unknown>) {
  return Number.isInteger(row.id) && Number(row.id) > 0
}

function isNullableString(value: unknown) {
  return value === null || typeof value === 'string'
}

function isNullableNumber(value: unknown, nonNegative = true) {
  return value === null || (
    typeof value === 'number' && Number.isFinite(value) && (!nonNegative || value >= 0)
  )
}

function isNullableId(value: unknown) {
  return value === null || (Number.isInteger(value) && Number(value) > 0)
}

function isDateOnly(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function isTimestamp(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

const validRows: Record<(typeof backupTables)[number], (row: Record<string, unknown>) => boolean> = {
  clientes: (row) => hasId(row) && typeof row.nome === 'string' && isNullableString(row.email ?? null) && isNullableString(row.telefone ?? null) && isNullableString(row.empresa ?? null),
  projetos: (row) =>
    hasId(row) && typeof row.titulo === 'string' && isNullableId(row.cliente_id) &&
    isNullableString(row.descricao) && isNullableString(row.tipo) &&
    isNullableNumber(row.valor_total) && isNullableNumber(row.valor_pago) &&
    isNullableString(row.status) && (row.prazo === null || isDateOnly(row.prazo)) &&
    isNullableString(row.repo_url) && isNullableString(row.staging_url) && isNullableString(row.notas),
  gastos: (row) =>
    hasId(row) &&
    typeof row.descricao === 'string' &&
    isDateOnly(row.data) &&
    typeof row.valor === 'number' &&
    Number.isFinite(row.valor) && row.valor > 0 &&
    (row.pago === 0 || row.pago === 1) && (row.recorrente === 0 || row.recorrente === 1) &&
    (row.dia_vencimento === null || (Number.isInteger(row.dia_vencimento) && Number(row.dia_vencimento) >= 1 && Number(row.dia_vencimento) <= 31)) &&
    isNullableString(row.categoria_nome) && isNullableString(row.metodo) && isNullableString(row.notas),
  receitas: (row) =>
    hasId(row) &&
    typeof row.descricao === 'string' &&
    isDateOnly(row.data) &&
    typeof row.valor === 'number' &&
    Number.isFinite(row.valor) && row.valor > 0 && isNullableId(row.projeto_id) &&
    isNullableId(row.pagamento_id ?? null) && isNullableString(row.origem),
  investimentos: (row) => hasId(row) && typeof row.nome === 'string' && typeof row.tipo === 'string' &&
    isNullableNumber(row.meta_valor) && (row.meta_data === null || isDateOnly(row.meta_data)) &&
    isNullableString(row.notas) && (row.ativo === 0 || row.ativo === 1),
  aportes: (row) =>
    hasId(row) &&
    isDateOnly(row.data) &&
    typeof row.valor === 'number' &&
    Number.isFinite(row.valor) && row.valor > 0 && isNullableId(row.investimento_id) && isNullableString(row.tipo) && isNullableString(row.notas),
  tempo_projeto: (row) =>
    hasId(row) &&
    isTimestamp(row.inicio) &&
    (row.fim === null || isTimestamp(row.fim)) &&
    isNullableId(row.projeto_id) &&
    (row.duracao_min === null || (typeof row.duracao_min === 'number' && Number.isFinite(row.duracao_min) && row.duracao_min >= 0)) &&
    isNullableString(row.descricao) && (row.valor_hora === undefined || isNullableNumber(row.valor_hora)),
  configuracoes: (row) => typeof row.chave === 'string' && !!row.chave.trim() && typeof row.valor === 'string',
  pagamentos: (row) =>
    hasId(row) &&
    isDateOnly(row.data) &&
    typeof row.valor === 'number' &&
    Number.isFinite(row.valor) && row.valor > 0 && isNullableId(row.projeto_id) && isNullableString(row.metodo),
}

export function parseBackup(value: unknown): DevFlowBackup {
  if (
    !isRecord(value) ||
    value.app !== BACKUP_APP ||
    value.version !== BACKUP_VERSION ||
    typeof value.exportedAt !== 'string' ||
    Number.isNaN(Date.parse(value.exportedAt)) ||
    !isRecord(value.data)
  ) {
    throw new Error('Este ficheiro não é uma cópia de segurança compatível do DevFlow.')
  }

  for (const tableName of backupTables) {
    const rows = value.data[tableName]
    if (!Array.isArray(rows) || !rows.every((row) => isRecord(row) && validRows[tableName](row))) {
      throw new Error(`A secção "${tableName}" da cópia está inválida.`)
    }
    const ids = rows.map((row) => isRecord(row) ? row.id : null).filter((id) => id !== undefined && id !== null)
    if (new Set(ids).size !== ids.length) throw new Error(`A secção "${tableName}" contém identificadores repetidos.`)
  }

  const rawData = value.data
  const data = rawData as unknown as DevFlowBackup['data']
  if (!data.configuracoes.every((row) => typeof row.chave === 'string' && typeof row.valor === 'string')) {
    throw new Error('As preferências da cópia estão inválidas.')
  }

  const ids = <T extends { id?: number }>(rows: T[]) => new Set(rows.map((row) => row.id).filter((id): id is number => Number.isInteger(id)))
  const clientIds = ids(data.clientes)
  const projectIds = ids(data.projetos)
  const investmentIds = ids(data.investimentos)
  const paymentIds = ids(data.pagamentos)
  const paymentById = new Map(data.pagamentos.map((payment) => [payment.id, payment]))
  const hasRef = (id: number | null | undefined, ids: Set<number>) => id == null || ids.has(id)
  if (data.projetos.some((row) => !hasRef(row.cliente_id, clientIds))) throw new Error('A cópia contém projetos ligados a clientes inexistentes.')
  if (data.receitas.some((row) => !hasRef(row.projeto_id, projectIds) || !hasRef(row.pagamento_id, paymentIds))) throw new Error('A cópia contém receitas ligadas a registos inexistentes.')
  if (data.receitas.some((row) => {
    if (row.pagamento_id == null) return false
    const payment = paymentById.get(row.pagamento_id)
    return !payment || payment.projeto_id !== row.projeto_id || payment.valor !== row.valor || payment.data !== row.data
  })) throw new Error('A cópia contém receitas e pagamentos com valores ou ligações diferentes.')
  if (new Set(data.configuracoes.map((row) => row.chave)).size !== data.configuracoes.length) throw new Error('A cópia contém preferências repetidas.')
  if (data.pagamentos.some((row) => !hasRef(row.projeto_id, projectIds))) throw new Error('A cópia contém pagamentos ligados a projetos inexistentes.')
  if (data.aportes.some((row) => !hasRef(row.investimento_id, investmentIds))) throw new Error('A cópia contém movimentos ligados a investimentos inexistentes.')
  if (data.tempo_projeto.some((row) => !hasRef(row.projeto_id, projectIds))) throw new Error('A cópia contém sessões ligadas a projetos inexistentes.')

  return { ...value, data } as unknown as DevFlowBackup
}

export async function restoreBackup(backup: DevFlowBackup) {
  await db.transaction(
    'rw',
    [
      db.clientes,
      db.projetos,
      db.gastos,
      db.receitas,
      db.investimentos,
      db.aportes,
      db.tempo_projeto,
      db.configuracoes,
      db.pagamentos,
    ],
    async () => {
      await Promise.all([
        db.clientes.clear(),
        db.projetos.clear(),
        db.gastos.clear(),
        db.receitas.clear(),
        db.investimentos.clear(),
        db.aportes.clear(),
        db.tempo_projeto.clear(),
        db.configuracoes.clear(),
        db.pagamentos.clear(),
      ])
      await Promise.all([
        db.clientes.bulkPut(backup.data.clientes),
        db.projetos.bulkPut(backup.data.projetos),
        db.gastos.bulkPut(backup.data.gastos),
        db.receitas.bulkPut(backup.data.receitas),
        db.investimentos.bulkPut(backup.data.investimentos),
        db.aportes.bulkPut(backup.data.aportes),
        db.tempo_projeto.bulkPut(backup.data.tempo_projeto),
        db.configuracoes.bulkPut(backup.data.configuracoes),
        db.pagamentos.bulkPut(backup.data.pagamentos),
      ])
    },
  )
}
