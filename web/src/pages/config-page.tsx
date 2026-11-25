import { Download, FileUp, LoaderCircle, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FullScreenLoader } from '../components/ui/full-screen-loader'
import { Panel } from '../components/ui/panel'
import { useAsyncData } from '../hooks/use-data'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CURRENCY_OPTIONS,
  INPUT_BASE,
  formatCurrency,
} from '../lib/format'
import { fetchConfiguracoes, saveConfiguracoes } from '../lib/data'
import { createBackup, parseBackup, restoreBackup } from '../lib/data/backup'
import { readBrowserPreference, saveBrowserPreference } from '../lib/browser-storage'
import { downloadBlob } from '../lib/download'

const LAST_BACKUP_KEY = 'devflow-last-backup-at'

function downloadJson(filename: string, contents: string) {
  downloadBlob(filename, new Blob([contents], { type: 'application/json' }))
}

export function ConfigPage() {
  const { data, error, isLoading, reload } = useAsyncData(fetchConfiguracoes)
  const [form, setForm] = useState({
    alerta_conta_dias: '3',
    alerta_prazo_dias: '7',
    moeda: 'CVE',
    nome_usuario: '',
    tema: 'light',
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null)
  const [backupError, setBackupError] = useState<string | null>(null)
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(() =>
    readBrowserPreference(LAST_BACKUP_KEY),
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (data) {
    setForm({
      alerta_conta_dias: data.alerta_conta_dias ?? '3',
      alerta_prazo_dias: data.alerta_prazo_dias ?? '7',
      moeda: data.moeda ?? 'CVE',
      nome_usuario: data.nome_usuario ?? '',
      tema: data.tema ?? 'light',
    })
    }
  }, [data])

  if (isLoading && !data) {
    return <FullScreenLoader label="A carregar as configuracoes..." />
  }

  if (error || !data) {
    return (
      <Panel
        actions={
          <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
            Tentar novamente
          </button>
        }
        description={error ?? 'Nao foi possivel carregar as configuracoes.'}
        title="Falha ao carregar"
      />
    )
  }

  async function handleSave() {
    setFeedback(null)
    setSaveError(null)
    setIsSaving(true)

    try {
      await saveConfiguracoes(form)
      // Sincronizar tema com localStorage e aplicar ao documento
      saveBrowserPreference('app-theme-mode', form.tema)
      document.documentElement.setAttribute('data-theme', form.tema)
      setFeedback('Configuracoes guardadas com sucesso.')
      await reload()
    } catch (caughtError) {
      setSaveError(
        caughtError instanceof Error ? caughtError.message : 'Nao foi possivel guardar as configuracoes.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCreateBackup() {
    setBackupFeedback(null)
    setBackupError(null)
    setIsBackingUp(true)

    try {
      const backup = await createBackup()
      const date = new Date(backup.exportedAt)
      const stamp = backup.exportedAt.slice(0, 10)
      downloadJson(`devflow-backup-${stamp}.json`, JSON.stringify(backup, null, 2))
      saveBrowserPreference(LAST_BACKUP_KEY, backup.exportedAt)
      setLastBackupAt(backup.exportedAt)
      setBackupFeedback(`Cópia criada em ${date.toLocaleString('pt-PT')}. Guarda o ficheiro num local seguro.`)
    } catch (caughtError) {
      setBackupError(caughtError instanceof Error ? caughtError.message : 'Não foi possível criar a cópia.')
    } finally {
      setIsBackingUp(false)
    }
  }

  async function handleRestoreBackup(file: File | undefined) {
    if (!file) return

    setBackupFeedback(null)
    setBackupError(null)
    setIsRestoring(true)

    try {
      const backup = parseBackup(JSON.parse(await file.text()) as unknown)
      const recordCount = Object.values(backup.data).reduce((total, rows) => total + rows.length, 0)
      const shouldRestore = window.confirm(
        `Restaurar ${recordCount} registo(s)? Esta ação substitui todos os dados guardados neste navegador.`,
      )
      if (!shouldRestore) return

      await restoreBackup(backup)
      saveBrowserPreference(LAST_BACKUP_KEY, backup.exportedAt)
      window.location.reload()
    } catch (caughtError) {
      setBackupError(caughtError instanceof Error ? caughtError.message : 'Não foi possível restaurar esta cópia.')
    } finally {
      setIsRestoring(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const lastBackupLabel = lastBackupAt
    ? new Date(lastBackupAt).toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Ainda não foi criada nenhuma cópia neste navegador.'

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <Panel
        actions={
          <button className={BUTTON_PRIMARY} disabled={isSaving} onClick={() => void handleSave()} type="button">
            Guardar configuracoes
          </button>
        }
        description="Preferências deste navegador, guardadas localmente."
        title="Preferencias"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Nome</span>
            <input
              className={INPUT_BASE}
              onChange={(event) => setForm((current) => ({ ...current, nome_usuario: event.target.value }))}
              type="text"
              value={form.nome_usuario}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Moeda</span>
            <select
              className={INPUT_BASE}
              onChange={(event) => setForm((current) => ({ ...current, moeda: event.target.value }))}
              value={form.moeda}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Tema</span>
            <select
              className={INPUT_BASE}
              onChange={(event) => setForm((current) => ({ ...current, tema: event.target.value }))}
              value={form.tema}
            >
              <option value="light">Marfim</option>
              <option value="dark">Escuro</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Dias para prazo</span>
            <input
              className={INPUT_BASE}
              onChange={(event) =>
                setForm((current) => ({ ...current, alerta_prazo_dias: event.target.value }))
              }
              type="number"
              value={form.alerta_prazo_dias}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Dias para contas</span>
            <input
              className={INPUT_BASE}
              onChange={(event) =>
                setForm((current) => ({ ...current, alerta_conta_dias: event.target.value }))
              }
              type="number"
              value={form.alerta_conta_dias}
            />
          </label>
        </div>

        {feedback ? <p className="mt-4 text-sm text-[var(--color-success)]">{feedback}</p> : null}
        {saveError ? <p className="mt-4 text-sm text-[var(--color-danger)]">{saveError}</p> : null}
      </Panel>

      <div className="space-y-6">
        <Panel description="Resumo rápido do ambiente configurado." title="Pré-visualização">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Formato monetario atual</p>
            <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              {formatCurrency(0, form.moeda)}
            </p>
            <div className="mt-6 space-y-2 text-sm text-[var(--text-muted)]">
              <p>Utilizador: {form.nome_usuario || 'nao definido'}</p>
              <p>Alerta de prazo: {form.alerta_prazo_dias || '0'} dia(s)</p>
              <p>Alerta de contas: {form.alerta_conta_dias || '0'} dia(s)</p>
            </div>
          </div>
        </Panel>

        <Panel id="backup" description="Leva os teus registos para outro browser ou recupera-os depois de limpar os dados locais." title="Dados e cópias de segurança">
          <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)]">A cópia inclui todos os teus dados</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                Projetos, clientes, movimentos financeiros, investimentos, sessões e preferências. O ficheiro fica no teu dispositivo.
              </p>
              <p className="mt-3 text-xs text-[var(--text-muted)]" aria-live="polite">
                Última cópia neste navegador: {lastBackupLabel}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button className={BUTTON_PRIMARY} disabled={isBackingUp || isRestoring} onClick={() => void handleCreateBackup()} type="button">
              {isBackingUp ? <LoaderCircle aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : <Download aria-hidden="true" className="mr-2 h-4 w-4" />}
              {isBackingUp ? 'A criar cópia…' : 'Descarregar cópia'}
            </button>
            <button className={BUTTON_SECONDARY} disabled={isBackingUp || isRestoring} onClick={() => fileInputRef.current?.click()} type="button">
              {isRestoring ? <LoaderCircle aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : <FileUp aria-hidden="true" className="mr-2 h-4 w-4" />}
              {isRestoring ? 'A validar cópia…' : 'Restaurar de ficheiro'}
            </button>
            <input
              ref={fileInputRef}
              accept="application/json,.json"
              aria-label="Escolher ficheiro de cópia do DevFlow"
              className="sr-only"
              onChange={(event) => void handleRestoreBackup(event.target.files?.[0])}
              type="file"
            />
          </div>

          {backupFeedback ? <p className="mt-4 text-sm text-[var(--color-success)]" role="status">{backupFeedback}</p> : null}
          {backupError ? <p className="mt-4 text-sm text-[var(--color-danger)]" role="alert">{backupError}</p> : null}
        </Panel>

      </div>
    </div>
  )
}
