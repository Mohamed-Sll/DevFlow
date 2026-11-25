import { Download, FileSpreadsheet, FileText, LoaderCircle, PieChart } from 'lucide-react'
import { useRef, useState } from 'react'
import { EXPORT_PRESETS, exportToCsv, type ExportType } from '../../lib/export/export'
import { cx } from '../../lib/cn'
import type { Aporte, Gasto, Investimento, Projeto, Receita, TempoProjeto } from '../../lib/types'

interface ExportDropdownProps<Row> {
  data: Row[]
  type: ExportType
  filename?: string
  label?: string
}

interface ExportCompletoProps {
  projetos: Projeto[]
  gastos: Gasto[]
  receitas: Receita[]
  sessoes: TempoProjeto[]
  investimentos: Investimento[]
  aportes: Aporte[]
  label?: string
}

export function ExportDropdown<Row>({ data, type, filename, label = 'Exportar' }: ExportDropdownProps<Row>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState<'csv' | 'xlsx' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const loadingRef = useRef<'csv' | 'xlsx' | null>(null)

  async function handleExport(format: 'csv' | 'xlsx') {
    if (loadingRef.current) return
    loadingRef.current = format
    setIsLoading(format)
    setIsOpen(false)
    setExportError(null)

    try {
      const preset = EXPORT_PRESETS[type]
      if (format === 'csv') {
        await exportToCsv(preset as never, data as never, filename)
      } else {
        const { exportToXlsx } = await import('../../lib/export/excel')
        await exportToXlsx(preset as never, data as never, filename)
      }
    } catch (error) {
      console.error('Falha ao exportar dados:', error)
      setExportError('Não foi possível gerar o ficheiro. Tenta novamente.')
    } finally {
      loadingRef.current = null
      setIsLoading(null)
    }
  }

  return (
    <div className="relative">
      <button
        className={cx(
          'inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition',
          isLoading
            ? 'cursor-not-allowed border-[var(--border-subtle)]/50 text-[var(--text-muted)]'
            : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
        )}
        disabled={!!isLoading}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {isLoading ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isLoading === 'csv' ? 'A gerar CSV...' : isLoading === 'xlsx' ? 'A gerar Excel...' : label}
      </button>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 min-w-[200px] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-lg" role="menu">
            <button
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
              onClick={() => handleExport('csv')}
              role="menuitem"
              type="button"
            >
              <FileSpreadsheet className="h-4 w-4 text-[var(--color-info)]" />
              <div>
                <p className="font-medium">CSV para Excel</p>
                <p className="text-[11px] text-[var(--text-muted)]">Colunas e decimais no formato local</p>
              </div>
            </button>
            <div className="border-t border-[var(--border-subtle)]" />
            <button
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
              onClick={() => handleExport('xlsx')}
              role="menuitem"
              type="button"
            >
              <FileSpreadsheet className="h-4 w-4 text-[var(--color-success)]" />
              <div>
                <p className="font-medium">Excel (.xlsx)</p>
                <p className="text-[11px] text-[var(--text-muted)]">Formatado com resumos</p>
              </div>
            </button>
          </div>
        </>
      ) : null}
      {exportError ? <p className="absolute right-0 top-full z-20 mt-1 w-56 text-xs text-[var(--color-danger)]" role="alert">{exportError}</p> : null}
    </div>
  )
}

export function ExportCompleto({ projetos, gastos, receitas, sessoes, investimentos, aportes, label = 'Exportar' }: ExportCompletoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState<'xlsx' | 'pdf' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const loadingRef = useRef<'xlsx' | 'pdf' | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const invalidDateRange = Boolean(dateRange.start && dateRange.end && dateRange.start > dateRange.end)

  function filterByDateRange<T>(items: T[], getDate: (item: T) => string): T[] {
    if (!dateRange.start && !dateRange.end) return items
    return items.filter((item) => {
      const itemDate = getDate(item)
      if (dateRange.start && itemDate < dateRange.start) return false
      if (dateRange.end && itemDate > dateRange.end) return false
      return true
    })
  }

  async function handleExport(format: 'xlsx' | 'pdf') {
    if (loadingRef.current) return
    loadingRef.current = format
    setIsLoading(format)
    setIsOpen(false)
    setExportError(null)

    try {
      if (invalidDateRange) {
        setExportError('A data inicial tem de ser anterior ou igual à data final.')
        return
      }

      const filteredProjetos = projetos
      const filteredGastos = filterByDateRange(gastos, (item) => item.data)
      const filteredReceitas = filterByDateRange(receitas, (item) => item.data)
      const filteredSessoes = filterByDateRange(sessoes, (item) => item.inicio.slice(0, 10))

      const stamp = dateRange.start || dateRange.end
        ? `${dateRange.start || ''}-${dateRange.end || ''}`
        : new Date().toISOString().slice(0, 10)

      if (format === 'xlsx') {
        const { exportToXlsxCompleto } = await import('../../lib/export/excel')
        await exportToXlsxCompleto(filteredProjetos, filteredGastos, filteredReceitas, filteredSessoes, investimentos, aportes, stamp)
      } else {
        const { exportToPdfCompleto } = await import('../../lib/export/pdf')
        await exportToPdfCompleto(filteredProjetos, filteredGastos, filteredReceitas, filteredSessoes, investimentos, aportes, stamp)
      }
    } catch (error) {
      console.error('Falha ao exportar relatorio completo:', error)
      setExportError('Não foi possível gerar o relatório. Tenta novamente.')
    } finally {
      loadingRef.current = null
      setIsLoading(null)
    }
  }

  return (
    <div className="relative flex flex-wrap items-end gap-2">
      <label className="flex min-w-[130px] flex-1 flex-col gap-1 text-[10px] font-medium text-[var(--text-muted)] sm:flex-none">
        De
        <input
        type="date"
        value={dateRange.start}
        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-primary)]"
        aria-label="Data inicial do relatório"
      />
      </label>
      <label className="flex min-w-[130px] flex-1 flex-col gap-1 text-[10px] font-medium text-[var(--text-muted)] sm:flex-none">
        Até
        <input
        type="date"
        value={dateRange.end}
        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-primary)]"
        aria-label="Data final do relatório"
      />
      </label>
      {invalidDateRange ? <p className="w-full text-xs text-[var(--color-danger)]" role="alert">A data inicial tem de ser anterior ou igual à data final.</p> : null}
      <p className="w-full text-[10px] text-[var(--text-muted)]">O período filtra receitas, gastos e sessões. Projetos e investimentos são listados à parte e não entram no saldo operacional.</p>
      <div className="relative">
        <button
          className={cx(
            'inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition',
            isLoading
              ? 'cursor-not-allowed border-[var(--border-subtle)]/50 text-[var(--text-muted)]'
              : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
          )}
          disabled={!!isLoading || invalidDateRange}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          {isLoading ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PieChart className="mr-2 h-4 w-4" />
          )}
          {isLoading === 'xlsx' ? 'A gerar Excel...' : isLoading === 'pdf' ? 'A gerar PDF...' : label}
        </button>

        {isOpen ? (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 z-20 mt-1 min-w-[220px] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-lg" role="menu">
              <button
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
                onClick={() => handleExport('xlsx')}
                role="menuitem"
                type="button"
              >
                <FileSpreadsheet className="h-4 w-4 text-[var(--color-success)]" />
                <div>
                  <p className="font-medium">Excel Completo (.xlsx)</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Lucro/prejuízo + resumos + todas as abas
                  </p>
                </div>
              </button>
              <div className="border-t border-[var(--border-subtle)]" />
              <button
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
                onClick={() => handleExport('pdf')}
                role="menuitem"
                type="button"
              >
                <FileText className="h-4 w-4 text-[var(--color-danger)]" />
                <div>
                  <p className="font-medium">PDF</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Relatório formatado para impressão
                  </p>
                </div>
              </button>
            </div>
          </>
        ) : null}
      </div>
      {exportError ? <p className="w-full text-xs text-[var(--color-danger)]" role="alert">{exportError}</p> : null}
    </div>
  )
}
