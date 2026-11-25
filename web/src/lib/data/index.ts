import { liveQuery } from 'dexie'
import { mapConfiguracoes } from '../format'
import type {
  Aporte,
  ClienteSummary,
  ConfigMap,
  Gasto,
  Investimento,
  InvestimentoSummary,
  Projeto,
  ProjetoSummary,
  Receita,
  TempoProjeto,
} from '../types'
import {
  type DbAporte,
  type DbGasto,
  type DbInvestimento,
  type DbProjeto,
  type DbReceita,
  type DbTempoProjeto,
  db,
} from './db'
import { assertDateOnly, assertNonNegativeAmount, statusAfterProjectPayment } from '../financial-rules'

export interface CreateProjetoInput {
  clientName: string
  deadline?: string
  description?: string
  notes?: string
  repoUrl?: string
  stagingUrl?: string
  status?: string
  title: string
  totalValue?: number
  type?: string
}

export interface CreateGastoInput {
  category?: string
  date: string
  description: string
  dueDay?: number | null
  method?: string
  notes?: string
  paid?: boolean
  recurring?: boolean
  value: number
}

export interface CreateReceitaInput {
  date: string
  description: string
  projectId?: number | null
  source?: string
  value: number
}

export interface CreateInvestimentoInput {
  active?: boolean
  name: string
  notes?: string
  targetDate?: string | null
  targetValue?: number | null
  type: string
}

export interface CreateAporteInput {
  date: string
  investmentId: number
  notes?: string
  type?: string
  value: number
}

function cleanText(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed || null
}

function cleanDate(value?: string | null) {
  return value || null
}

function normalizeAmount(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0
}

function nowISO() {
  return new Date().toISOString()
}

function compactPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

function projetoToType(p: DbProjeto, cliente: ClienteSummary | null): Projeto {
  return {
    ...p,
    id: p.id!,
    clientes: cliente,
  }
}

function receitaToType(r: DbReceita, projeto: ProjetoSummary | null): Receita {
  return {
    ...r,
    id: r.id!,
    projetos: projeto,
  }
}

function aporteToType(a: DbAporte, investimento: InvestimentoSummary | null): Aporte {
  return {
    ...a,
    id: a.id!,
    investimentos: investimento,
  }
}

function tempoProjetoToType(t: DbTempoProjeto, projeto: ProjetoSummary | null): TempoProjeto {
  return {
    ...t,
    id: t.id!,
    projetos: projeto,
  }
}

async function createOrGetCliente(nome: string): Promise<number> {
  const clientName = nome.trim()
  if (!clientName) throw new Error('Informe o nome do cliente.')

  const existing = await db.clientes.where('nome').equals(clientName).first()
  if (existing) return existing.id!

  const id = await db.clientes.add({ nome: clientName })
  return id
}

// ── Queries ──────────────────────────────────────────────

export async function fetchConfiguracoes(): Promise<ConfigMap> {
  const rows = await db.configuracoes.toArray()
  return mapConfiguracoes(rows as unknown as Array<{ chave: string; valor: string }>)
}

export async function fetchProjetos(): Promise<Projeto[]> {
  const [allProjects, clients] = await Promise.all([db.projetos.toArray(), db.clientes.toArray()])
  const clientById = new Map(clients.map((client) => [client.id!, client]))
  const projetos = allProjects
    .filter((project) => project.prazo !== null)
    .sort((left, right) => (right.prazo ?? '').localeCompare(left.prazo ?? ''))
  const semPrazo = allProjects.filter((project) => project.prazo === null)
  const allProjetos = [...projetos, ...semPrazo]
  return allProjetos.map((project) => {
    const client = project.cliente_id ? clientById.get(project.cliente_id) : undefined
    const summary = client
      ? { id: client.id!, nome: client.nome, email: client.email, empresa: client.empresa }
      : null
    return projetoToType(project, summary)
  })
}

export async function fetchGastos(): Promise<Gasto[]> {
  const gastos = await db.gastos.orderBy('data').reverse().toArray()
  return gastos.map((g) => ({ ...g, id: g.id! }))
}

export async function fetchReceitas(): Promise<Receita[]> {
  const [receipts, projects] = await Promise.all([
    db.receitas.orderBy('data').reverse().toArray(),
    db.projetos.toArray(),
  ])
  const projectById = new Map(projects.map((project) => [project.id!, project]))
  return receipts.map((receipt) => {
    const project = receipt.projeto_id ? projectById.get(receipt.projeto_id) : undefined
    return receitaToType(receipt, project ? { id: project.id!, titulo: project.titulo } : null)
  })
}

export async function fetchInvestimentos(): Promise<Investimento[]> {
  const items = await db.investimentos.orderBy('criado_em').reverse().toArray()
  return items.map((i) => ({ ...i, id: i.id! }))
}

export async function fetchAportes(): Promise<Aporte[]> {
  const [contributions, investments] = await Promise.all([
    db.aportes.orderBy('data').reverse().toArray(),
    db.investimentos.toArray(),
  ])
  const investmentById = new Map(investments.map((investment) => [investment.id!, investment]))
  return contributions.map((contribution) => {
    const investment = contribution.investimento_id
      ? investmentById.get(contribution.investimento_id)
      : undefined
    const summary = investment
      ? { id: investment.id!, nome: investment.nome, tipo: investment.tipo }
      : null
    return aporteToType(contribution, summary)
  })
}

export async function fetchTempoProjeto(): Promise<TempoProjeto[]> {
  const [sessions, projects] = await Promise.all([
    db.tempo_projeto.orderBy('inicio').reverse().toArray(),
    db.projetos.toArray(),
  ])
  const projectById = new Map(projects.map((project) => [project.id!, project]))
  return sessions.map((session) => {
    const project = session.projeto_id ? projectById.get(session.projeto_id) : undefined
    return tempoProjetoToType(
      session,
      project ? { id: project.id!, titulo: project.titulo } : null,
    )
  })
}

// ── Snapshots ─────────────────────────────────────────────

export async function fetchDashboardSnapshot() {
  const [configuracoes, projetos, gastos, receitas, investimentos, aportes, sessoes] =
    await Promise.all([
      fetchConfiguracoes(),
      fetchProjetos(),
      fetchGastos(),
      fetchReceitas(),
      fetchInvestimentos(),
      fetchAportes(),
      fetchTempoProjeto(),
    ])
  return { aportes, configuracoes, gastos, investimentos, projetos, receitas, sessoes }
}

export async function fetchProjectsSnapshot() {
  const [configuracoes, projetos] = await Promise.all([fetchConfiguracoes(), fetchProjetos()])
  return { configuracoes, projetos }
}

export async function fetchFinanceSnapshot() {
  const [configuracoes, gastos, projetos, receitas] = await Promise.all([
    fetchConfiguracoes(),
    fetchGastos(),
    fetchProjetos(),
    fetchReceitas(),
  ])
  return { configuracoes, gastos, projetos, receitas }
}

export async function fetchInvestmentsSnapshot() {
  const [configuracoes, investimentos, aportes] = await Promise.all([
    fetchConfiguracoes(),
    fetchInvestimentos(),
    fetchAportes(),
  ])
  return { aportes, configuracoes, investimentos }
}

export async function fetchTimerSnapshot() {
  const [configuracoes, projetos, sessoes] = await Promise.all([
    fetchConfiguracoes(),
    fetchProjetos(),
    fetchTempoProjeto(),
  ])
  return { configuracoes, projetos, sessoes }
}

// ── Mutations: Timer ──────────────────────────────────────

export async function startWorkSession(projetoId: number, descricao?: string, hourlyRate = 0) {
  if (!Number.isFinite(hourlyRate) || hourlyRate < 0) throw new Error('O valor por hora é inválido.')
  await db.transaction('rw', [db.projetos, db.tempo_projeto], async () => {
    const project = await db.projetos.get(projetoId)
    if (!project) throw new Error('O projeto selecionado já não existe.')

    const active = await db.tempo_projeto.filter((session) => session.fim === null).first()
    if (active) {
      throw new Error('Já existe uma sessão ativa. Termina a sessão atual antes de iniciar outra.')
    }

    const now = nowISO()
    await db.tempo_projeto.add({
      descricao: descricao?.trim() || null,
      inicio: now,
      fim: null,
      duracao_min: null,
      projeto_id: projetoId,
      criado_em: now,
      valor_hora: hourlyRate,
    })
  })
}

export async function stopWorkSession(session: TempoProjeto, descricao?: string) {
  await db.transaction('rw', db.tempo_projeto, async () => {
    const current = await db.tempo_projeto.get(session.id)
    if (!current || current.fim !== null) {
      throw new Error('Esta sessão já foi terminada ou já não existe.')
    }

    const end = new Date()
    const start = new Date(current.inicio)
    if (!Number.isFinite(start.getTime())) throw new Error('A hora de início desta sessão é inválida.')
    const durationMinutes = Math.max(Math.floor((end.getTime() - start.getTime()) / 60000), 0)
    await db.tempo_projeto.update(session.id, {
      descricao: descricao?.trim() || current.descricao || null,
      duracao_min: durationMinutes,
      fim: end.toISOString(),
    })
  })
}

// ── Mutations: Config ─────────────────────────────────────

export async function saveConfiguracoes(values: ConfigMap) {
  const payload = Object.entries(values).map(([chave, valor]) => ({ chave, valor }))
  await db.transaction('rw', db.configuracoes, async () => {
    for (const row of payload) {
      // A tabela usa `chave` como chave interna; a chave também já está no objeto.
      await db.configuracoes.put(row)
    }
  })
}

// ── Mutations: Projetos ───────────────────────────────────

export async function createProjeto(input: CreateProjetoInput) {
  const title = input.title.trim()
  if (!title) throw new Error('Informe o titulo do projeto.')
  assertNonNegativeAmount(input.totalValue, 'O valor total do projeto')
  if (input.deadline) assertDateOnly(input.deadline, 'o prazo do projeto')

  const payload = compactPayload({
    atualizado_em: nowISO(),
    cliente_id: null,
    criado_em: nowISO(),
    descricao: cleanText(input.description),
    notas: cleanText(input.notes),
    prazo: cleanDate(input.deadline),
    repo_url: cleanText(input.repoUrl),
    staging_url: cleanText(input.stagingUrl),
    status: cleanText(input.status) ?? 'pendente',
    tipo: cleanText(input.type),
    titulo: title,
    valor_pago: 0,
    valor_total: normalizeAmount(input.totalValue),
  })
  await db.transaction('rw', [db.clientes, db.projetos], async () => {
    const clientId = await createOrGetCliente(input.clientName)
    await db.projetos.add({ ...payload, cliente_id: clientId } as unknown as DbProjeto)
  })
}

export async function updateProjetoStatus(projectId: number, status: string) {
  const nextStatus = cleanText(status)?.toLowerCase()
  if (!nextStatus) throw new Error('Selecione um status valido.')
  const updated = await db.projetos.update(projectId, {
    atualizado_em: nowISO(),
    status: nextStatus,
  })
  if (updated === 0) throw new Error('Este projeto já não existe.')
}

export async function updateProjeto(projectId: number, input: CreateProjetoInput) {
  const title = input.title.trim()
  if (!title) throw new Error('Informe o título do projeto.')
  if (!Number.isFinite(projectId) || projectId <= 0) throw new Error('Projeto inválido.')
  if (input.totalValue !== undefined && (!Number.isFinite(input.totalValue) || input.totalValue < 0)) {
    throw new Error('O valor total não pode ser negativo.')
  }
  if (input.deadline) assertDateOnly(input.deadline, 'o prazo do projeto')

  await db.transaction('rw', [db.clientes, db.projetos], async () => {
    const project = await db.projetos.get(projectId)
    if (!project) throw new Error('Este projeto já não existe.')
    if (input.totalValue !== undefined && input.totalValue < (project.valor_pago ?? 0)) {
      throw new Error('O valor total não pode ser menor do que o valor já pago.')
    }

    const clientId = await createOrGetCliente(input.clientName)
    await db.projetos.update(projectId, {
      atualizado_em: nowISO(),
      cliente_id: clientId,
      descricao: cleanText(input.description),
      notas: cleanText(input.notes),
      prazo: cleanDate(input.deadline),
      repo_url: cleanText(input.repoUrl),
      staging_url: cleanText(input.stagingUrl),
      status: cleanText(input.status) ?? 'pendente',
      tipo: cleanText(input.type),
      titulo: title,
      valor_total: normalizeAmount(input.totalValue),
    })
  })
}

export async function deleteProjeto(projectId: number) {
  await db.transaction('rw', [db.pagamentos, db.receitas, db.tempo_projeto, db.projetos], async () => {
    await db.pagamentos.where('projeto_id').equals(projectId).delete()
    await db.receitas.where('projeto_id').equals(projectId).delete()
    await db.tempo_projeto.where('projeto_id').equals(projectId).delete()
    await db.projetos.delete(projectId)
  })
}

// ── Mutations: Gastos ─────────────────────────────────────

export async function createGasto(input: CreateGastoInput) {
  const description = input.description.trim()
  if (!description) throw new Error('Informe a descricao do gasto.')
  if (!input.date) throw new Error('Informe a data do gasto.')
  assertDateOnly(input.date, 'o gasto')
  if (normalizeAmount(input.value) <= 0) throw new Error('O valor do gasto deve ser maior do que zero.')
  if (input.recurring && input.dueDay != null && (!Number.isInteger(input.dueDay) || input.dueDay < 1 || input.dueDay > 31)) {
    throw new Error('O dia de vencimento deve estar entre 1 e 31.')
  }

  const payload = compactPayload({
    categoria_nome: cleanText(input.category),
    criado_em: nowISO(),
    data: input.date,
    descricao: description,
    dia_vencimento: input.recurring ? input.dueDay ?? null : null,
    metodo: cleanText(input.method),
    notas: cleanText(input.notes),
    pago: input.paid === false ? 0 : 1,
    recorrente: input.recurring ? 1 : 0,
    valor: normalizeAmount(input.value),
  })
  await db.gastos.add(payload as unknown as DbGasto)
}

export async function deleteGasto(expenseId: number) {
  await db.gastos.delete(expenseId)
}

export async function updateGasto(expenseId: number, input: CreateGastoInput) {
  const description = input.description.trim()
  if (!description) throw new Error('Informe a descrição do gasto.')
  assertDateOnly(input.date, 'o gasto')
  if (!Number.isFinite(input.value) || input.value <= 0) throw new Error('O valor do gasto deve ser maior do que zero.')
  if (input.recurring && input.dueDay != null && (!Number.isInteger(input.dueDay) || input.dueDay < 1 || input.dueDay > 31)) {
    throw new Error('O dia de vencimento deve estar entre 1 e 31.')
  }
  const updated = await db.gastos.update(expenseId, {
    categoria_nome: cleanText(input.category),
    data: input.date,
    descricao: description,
    dia_vencimento: input.recurring ? input.dueDay ?? null : null,
    metodo: cleanText(input.method),
    notas: cleanText(input.notes),
    pago: input.paid === false ? 0 : 1,
    recorrente: input.recurring ? 1 : 0,
    valor: input.value,
  })
  if (updated === 0) throw new Error('Este gasto já não existe.')
}

export async function updateGastoStatus(expenseId: number, paid: boolean) {
  const updated = await db.gastos.update(expenseId, { pago: paid ? 1 : 0 })
  if (updated === 0) throw new Error('Este gasto já não existe.')
}

// ── Mutations: Receitas ───────────────────────────────────

export async function createReceita(input: CreateReceitaInput) {
  const description = input.description.trim()
  if (!description) throw new Error('Informe a descricao da receita.')
  if (!input.date) throw new Error('Informe a data da receita.')
  assertDateOnly(input.date, 'a receita')
  if (normalizeAmount(input.value) <= 0) throw new Error('O valor da receita deve ser maior do que zero.')

  const value = normalizeAmount(input.value)
  const now = nowISO()
  await db.transaction('rw', [db.receitas, db.pagamentos, db.projetos], async () => {
    let paymentId: number | null = null

    if (input.projectId) {
      const project = await db.projetos.get(input.projectId)
      if (!project) throw new Error('O projeto associado já não existe.')

      paymentId = await db.pagamentos.add({
        projeto_id: input.projectId,
        valor: value,
        data: input.date,
        metodo: cleanText(input.source) ?? 'Projeto',
        criado_em: now,
      })

      const paidValue = (project.valor_pago ?? 0) + value
      const status = statusAfterProjectPayment(project.status, project.valor_total, paidValue)

      await db.projetos.update(input.projectId, {
        atualizado_em: now,
        status,
        valor_pago: paidValue,
      })
    }

    await db.receitas.add({
      criado_em: now,
      data: input.date,
      descricao: description,
      origem: cleanText(input.source),
      pagamento_id: paymentId,
      projeto_id: input.projectId ?? null,
      valor: value,
    })
  })
}

export async function deleteReceita(receiptId: number) {
  await db.transaction('rw', [db.receitas, db.pagamentos, db.projetos], async () => {
    const receipt = await db.receitas.get(receiptId)
    if (!receipt) throw new Error('Esta receita já não existe.')

    if (receipt.pagamento_id && receipt.projeto_id) {
      await db.pagamentos.delete(receipt.pagamento_id)
      const project = await db.projetos.get(receipt.projeto_id)
      if (project) {
        const paidValue = Math.max((project.valor_pago ?? 0) - receipt.valor, 0)
        const status = statusAfterProjectPayment(project.status, project.valor_total, paidValue)

        await db.projetos.update(receipt.projeto_id, {
          atualizado_em: nowISO(),
          status,
          valor_pago: paidValue,
        })
      }
    }

    await db.receitas.delete(receiptId)
  })
}

export async function updateReceita(receiptId: number, input: CreateReceitaInput) {
  const description = input.description.trim()
  if (!description) throw new Error('Informe a descrição da receita.')
  assertDateOnly(input.date, 'a receita')
  if (!Number.isFinite(input.value) || input.value <= 0) throw new Error('O valor da receita deve ser maior do que zero.')

  await db.transaction('rw', [db.receitas, db.pagamentos, db.projetos], async () => {
    const receipt = await db.receitas.get(receiptId)
    if (!receipt) throw new Error('Esta receita já não existe.')
    const oldProjectId = receipt.projeto_id
    const newProjectId = input.projectId ?? null
    const oldPayment = receipt.pagamento_id ? await db.pagamentos.get(receipt.pagamento_id) : undefined
    let paymentId = receipt.pagamento_id ?? null

    if (oldPayment && newProjectId) {
      await db.pagamentos.update(oldPayment.id!, {
        projeto_id: newProjectId,
        valor: input.value,
        data: input.date,
        metodo: cleanText(input.source) ?? 'Projeto',
      })
    } else if (oldPayment) {
      await db.pagamentos.delete(oldPayment.id!)
      paymentId = null
    } else if (newProjectId) {
      paymentId = await db.pagamentos.add({
        projeto_id: newProjectId,
        valor: input.value,
        data: input.date,
        metodo: cleanText(input.source) ?? 'Projeto',
        criado_em: nowISO(),
      })
    }

    if (oldProjectId && oldProjectId !== newProjectId) {
      const oldProject = await db.projetos.get(oldProjectId)
      if (oldProject) {
        const oldPaid = Math.max((oldProject.valor_pago ?? 0) - receipt.valor, 0)
        await db.projetos.update(oldProjectId, {
          atualizado_em: nowISO(),
          status: statusAfterProjectPayment(oldProject.status, oldProject.valor_total, oldPaid),
          valor_pago: oldPaid,
        })
      }
    }

    if (newProjectId) {
      const project = await db.projetos.get(newProjectId)
      if (!project) throw new Error('O projeto associado já não existe.')
      const baselinePaid = oldProjectId === newProjectId
        ? Math.max((project.valor_pago ?? 0) - receipt.valor, 0)
        : (project.valor_pago ?? 0)
      const paidValue = baselinePaid + input.value
      await db.projetos.update(newProjectId, {
        atualizado_em: nowISO(),
        status: statusAfterProjectPayment(project.status, project.valor_total, paidValue),
        valor_pago: paidValue,
      })
    }

    await db.receitas.update(receiptId, {
      data: input.date,
      descricao: description,
      origem: cleanText(input.source),
      pagamento_id: paymentId,
      projeto_id: newProjectId,
      valor: input.value,
    })
  })
}

// ── Mutations: Investimentos ──────────────────────────────

export async function createInvestimento(input: CreateInvestimentoInput) {
  const name = input.name.trim()
  const type = input.type.trim()
  if (!name) throw new Error('Informe o nome do investimento.')
  if (!type) throw new Error('Informe o tipo do investimento.')
  assertNonNegativeAmount(input.targetValue, 'A meta do investimento')
  if (input.targetDate) assertDateOnly(input.targetDate, 'a meta do investimento')

  const payload = compactPayload({
    ativo: input.active === false ? 0 : 1,
    criado_em: nowISO(),
    meta_data: cleanDate(input.targetDate),
    meta_valor:
      input.targetValue === null || input.targetValue === undefined
        ? null
        : normalizeAmount(input.targetValue),
    nome: name,
    notas: cleanText(input.notes),
    tipo: type,
  })
  await db.investimentos.add(payload as unknown as DbInvestimento)
}

export async function updateInvestimento(investmentId: number, input: CreateInvestimentoInput) {
  const name = input.name.trim()
  const type = input.type.trim()
  if (!name) throw new Error('Informe o nome do investimento.')
  if (!type) throw new Error('Informe o tipo do investimento.')
  assertNonNegativeAmount(input.targetValue, 'A meta do investimento')
  if (input.targetDate) assertDateOnly(input.targetDate, 'a meta do investimento')
  const updated = await db.investimentos.update(investmentId, {
    ativo: input.active === false ? 0 : 1,
    meta_data: cleanDate(input.targetDate),
    meta_valor: input.targetValue == null ? null : input.targetValue,
    nome: name,
    notas: cleanText(input.notes),
    tipo: type,
  })
  if (updated === 0) throw new Error('Este investimento já não existe.')
}

export async function deleteInvestimento(investmentId: number) {
  await db.transaction('rw', [db.aportes, db.investimentos], async () => {
    await db.aportes.where('investimento_id').equals(investmentId).delete()
    await db.investimentos.delete(investmentId)
  })
}

// ── Mutations: Aportes ────────────────────────────────────

export async function createAporte(input: CreateAporteInput) {
  if (!input.investmentId) throw new Error('Selecione um investimento.')
  if (!input.date) throw new Error('Informe a data do movimento.')
  assertDateOnly(input.date, 'o movimento')
  if (normalizeAmount(input.value) <= 0) throw new Error('O valor do movimento deve ser maior do que zero.')

  await db.transaction('rw', [db.investimentos, db.aportes], async () => {
    const investment = await db.investimentos.get(input.investmentId)
    if (!investment) throw new Error('O investimento selecionado já não existe.')

    const payload = compactPayload({
      criado_em: nowISO(),
      data: input.date,
      investimento_id: input.investmentId,
      notas: cleanText(input.notes),
      tipo: cleanText(input.type)?.toLowerCase() ?? 'aporte',
      valor: normalizeAmount(input.value),
    })
    await db.aportes.add(payload as unknown as DbAporte)
  })
}

export async function updateAporte(contributionId: number, input: CreateAporteInput) {
  if (!input.investmentId) throw new Error('Selecione um investimento.')
  assertDateOnly(input.date, 'o movimento')
  if (!Number.isFinite(input.value) || input.value <= 0) throw new Error('O valor do movimento deve ser maior do que zero.')
  await db.transaction('rw', [db.investimentos, db.aportes], async () => {
    const movement = await db.aportes.get(contributionId)
    if (!movement) throw new Error('Este movimento já não existe.')
    const investment = await db.investimentos.get(input.investmentId)
    if (!investment) throw new Error('O investimento selecionado já não existe.')
    await db.aportes.update(contributionId, {
      data: input.date,
      investimento_id: input.investmentId,
      notas: cleanText(input.notes),
      tipo: cleanText(input.type)?.toLowerCase() ?? 'aporte',
      valor: input.value,
    })
  })
}

export async function deleteAporte(contributionId: number) {
  await db.transaction('rw', db.aportes, async () => {
    const contribution = await db.aportes.get(contributionId)
    if (!contribution) throw new Error('Este movimento já não existe.')
    await db.aportes.delete(contributionId)
  })
}

// ── liveQuery helper ──────────────────────────────────────

export function observeQuery<T>(queryFn: () => Promise<T>) {
  return liveQuery(queryFn)
}
