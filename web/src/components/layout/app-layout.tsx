import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  Database,
  Landmark,
  Menu,
  Moon,
  Settings2,
  SunMedium,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAsyncData } from '../../hooks/use-data'
import { useNavigationShortcuts } from '../../hooks/use-keyboard-shortcuts'
import { fetchConfiguracoes, saveConfiguracoes } from '../../lib/data'
import { readBrowserPreference, saveBrowserPreference } from '../../lib/browser-storage'

const NAV_ITEMS = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
  { icon: BriefcaseBusiness, label: 'Projetos', path: '/projetos' },
  { icon: Wallet, label: 'Finanças', path: '/financas' },
  { icon: Landmark, label: 'Investimentos', path: '/investimentos' },
  { icon: Clock3, label: 'Timer', path: '/timer' },
  { icon: Settings2, label: 'Config', path: '/config' },
]

const PAGE_TITLES = [
  {
    eyebrow: 'Preferências',
    path: '/config',
    subtitle: 'Preferências pessoais, alertas e cópias dos teus dados.',
    title: 'Definições',
  },
  {
    eyebrow: 'Visao geral',
    path: '/dashboard',
    subtitle: 'Uma leitura clara dos projetos, entradas e despesas do teu negócio.',
    title: 'Dashboard',
  },
  {
    eyebrow: 'Visão financeira',
    path: '/financas',
    subtitle: 'Entradas, despesas e evolução financeira num só lugar.',
    title: 'Finanças',
  },
  {
    eyebrow: 'Património',
    path: '/investimentos',
    subtitle: 'Acompanha a carteira e os movimentos que registas.',
    title: 'Investimentos',
  },
  {
    eyebrow: 'Pipeline',
    path: '/projetos',
    subtitle: 'Organiza oportunidades e acompanha o trabalho em curso.',
    title: 'Projetos',
  },
  {
    eyebrow: 'Tempo e foco',
    path: '/timer',
    subtitle: 'Regista sessões de trabalho e acompanha o tempo faturável.',
    title: 'Tempo de trabalho',
  },
]

type ThemeMode = 'dark' | 'light'
const THEME_STORAGE_KEY = 'app-theme-mode'

export function AppLayout() {
  const location = useLocation()
  const { data: configuracoes } = useAsyncData(fetchConfiguracoes)
  useNavigationShortcuts()
  const [storedTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const stored = readBrowserPreference(THEME_STORAGE_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  })
  const [themeOverride, setThemeOverride] = useState<ThemeMode | null>(null)
  const configTheme =
    configuracoes?.tema === 'dark' || configuracoes?.tema === 'light' ? configuracoes.tema : null
  const theme = themeOverride ?? configTheme ?? storedTheme

  // Função para mudar tema e salvar na config
  const handleThemeChange = async (newTheme: ThemeMode) => {
    setThemeOverride(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    saveBrowserPreference(THEME_STORAGE_KEY, newTheme)
    
    // Salvar na base de dados
    if (configuracoes) {
      try {
        await saveConfiguracoes({
          ...configuracoes,
          tema: newTheme,
        })
      } catch (error) {
        console.error('Erro ao salvar tema:', error)
      }
    }
  }
  const heading =
    PAGE_TITLES.find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) ??
    PAGE_TITLES[1]
  const displayName = configuracoes?.nome_usuario?.trim() || 'User'
  const isDark = theme === 'dark'

  // Aplicar tema ao documento quando theme muda
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const [mobileMenuState, setMobileMenuState] = useState({
    open: false,
    pathname: location.pathname,
  })
  const mobileMenuOpen = mobileMenuState.open && mobileMenuState.pathname === location.pathname

  const initials = displayName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  const closeMobile = () => setMobileMenuState({ open: false, pathname: location.pathname })

  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuState({ open: false, pathname: location.pathname })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen, location.pathname])

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <div className="relative flex min-h-dvh flex-col lg:h-full lg:min-h-0 lg:flex-row">
        {/* Mobile top bar (logo + hamburger) */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] px-4 py-3 text-[var(--sidebar-text)] lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#315FEA] text-sm font-extrabold text-white">
              d.
            </div>
            <span className="font-['Manrope',sans-serif] text-lg font-bold tracking-tight text-[var(--sidebar-text)]">
              DevFlow
            </span>
          </div>
          <button
            aria-controls="app-sidebar"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fechar menu de navegacao' : 'Abrir menu de navegacao'}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--sidebar-muted)] transition-colors hover:bg-[var(--sidebar-active)] hover:text-[var(--sidebar-text)]"
            onClick={() => setMobileMenuState({ open: !mobileMenuOpen, pathname: location.pathname })}
            type="button"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile overlay backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            onClick={closeMobile}
          />
        )}

        {/* Sidebar drawer */}
        <aside
          id="app-sidebar"
          className={[
            'fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-[292px] flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] px-4 py-5 text-[var(--sidebar-text)] shadow-2xl transition-[transform,visibility] duration-300 ease-out lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-full lg:w-[248px] lg:translate-x-0 lg:overflow-y-auto lg:px-5 lg:py-6 lg:shadow-none',
            mobileMenuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
          ].join(' ')}
        >
          {/* Logo + close on mobile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#315FEA] text-sm font-extrabold text-white">
                d.
              </div>
              <span className="font-['Manrope',sans-serif] text-lg font-bold tracking-tight text-[var(--sidebar-text)]">
                DevFlow
              </span>
            </div>
            <button
              aria-label="Fechar menu de navegacao"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--sidebar-muted)] transition-colors hover:bg-[var(--sidebar-active)] hover:text-[var(--sidebar-text)] lg:hidden"
              onClick={closeMobile}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-7 flex items-center gap-3 rounded-xl border border-[var(--sidebar-border)] bg-white/[0.035] px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#315FEA]/15 text-xs font-semibold text-[#9BB8FF]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--sidebar-text)]">{displayName}</p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--sidebar-muted)]">Espaço de trabalho local</p>
            </div>
          </div>

          <nav aria-label="Navegação principal" className="mt-7 flex-1 space-y-1.5">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
              <NavLink
                key={path}
                to={path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--sidebar-active)] text-white'
                      : 'text-[var(--sidebar-muted)] hover:bg-white/[0.045] hover:text-white',
                  ].join(' ')
                }
              >
                <Icon className={['h-[18px] w-[18px]', location.pathname.startsWith(path) ? 'text-[#9BB8FF]' : ''].join(' ')} />
                {label}
              </NavLink>
            ))}
          </nav>


        </aside>

        <div className="flex min-h-0 flex-1 flex-col lg:h-full">
          <header className="sticky top-[57px] z-20 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/95 px-4 py-3 backdrop-blur-md md:px-7 lg:static lg:px-9">
            <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)] md:text-[11px]">{heading.eyebrow}</p>
                <h1 className="mt-1 font-['Manrope',sans-serif] text-xl font-extrabold leading-tight tracking-[-0.04em] text-[var(--text-primary)] sm:text-2xl lg:text-[30px]">
                  {heading.title}
                </h1>
                <p className="mt-1 hidden text-xs text-[var(--text-secondary)] sm:block md:text-sm">{heading.subtitle}</p>
              </div>

              <div className="flex items-center gap-1.5 md:gap-2">
                <button
                  aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                  onClick={() => void handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
                  type="button"
                >
                  {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <span className="hidden max-w-[160px] truncate text-xs font-medium text-[var(--text-secondary)] sm:inline">{displayName}</span>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 px-4 py-5 sm:px-6 md:py-7 lg:overflow-y-auto lg:px-9 lg:py-8">
            <div className="mx-auto w-full max-w-[1480px]">
              <div className="mb-5 flex flex-col gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-4 py-3 text-xs text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-2.5">
                  <Database aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  <p>
                    Os teus dados ficam neste navegador. Limpar os dados do site apaga o histórico.
                  </p>
                </div>
                <Link className="shrink-0 font-medium text-[var(--text-primary)] underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-current" to="/config#backup">
                  Criar cópia
                </Link>
              </div>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
