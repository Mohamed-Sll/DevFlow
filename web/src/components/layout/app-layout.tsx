import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  Landmark,
  Menu,
  Moon,
  Settings2,
  SunMedium,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAsyncData } from '../../hooks/use-data'
import { useNavigationShortcuts } from '../../hooks/use-keyboard-shortcuts'
import { fetchConfiguracoes, saveConfiguracoes } from '../../lib/data'

const NAV_ITEMS = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
  { icon: BriefcaseBusiness, label: 'Projetos', path: '/projetos' },
  { icon: Wallet, label: 'Finanças', path: '/financas' },
  { icon: Landmark, label: 'Investimentos', path: '/investimentos' },
  { icon: Clock3, label: 'Timer', path: '/timer' },
  { icon: Settings2, label: 'Definições', path: '/config' },
]

const PAGE_TITLES = [
  {
    eyebrow: 'Área pessoal',
    path: '/config',
    subtitle: 'Personaliza as tuas preferências e a forma como acompanhas o negócio.',
    title: 'Definições',
  },
  {
    eyebrow: 'Bom ter-te por aqui',
    path: '/dashboard',
    subtitle: 'Uma vista clara da atividade e das prioridades do teu negócio.',
    title: 'Dashboard',
  },
  {
    eyebrow: 'Controlo financeiro',
    path: '/financas',
    subtitle: 'Acompanha receitas, despesas e o saldo ao longo do tempo.',
    title: 'Financas',
  },
  {
    eyebrow: 'Património',
    path: '/investimentos',
    subtitle: 'Organiza a carteira, os movimentos e as tuas metas.',
    title: 'Investimentos',
  },
  {
    eyebrow: 'Trabalho',
    path: '/projetos',
    subtitle: 'Mantém cada projeto organizado, do primeiro contacto à entrega.',
    title: 'Projetos',
  },
  {
    eyebrow: 'Tempo e foco',
    path: '/timer',
    subtitle: 'Regista sessões de trabalho e acompanha o tempo dedicado.',
    title: 'Timer de trabalho',
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

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
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
    window.localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    
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
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
        {/* Mobile top bar (logo + hamburger) */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-[var(--inverted-text)]">
              D
            </div>
            <span className="font-['Space_Grotesk',sans-serif] text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              DevFlow
            </span>
          </div>
          <button
            aria-controls="app-sidebar"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fechar menu de navegacao' : 'Abrir menu de navegacao'}
            className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
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
            'fixed inset-y-0 left-0 z-50 flex w-[78vw] max-w-[300px] flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] px-5 py-6 shadow-2xl transition-[transform,visibility] duration-300 ease-out lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-[252px] lg:translate-x-0 lg:overflow-y-auto lg:border-r lg:px-5 lg:py-7 lg:shadow-none',
            mobileMenuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
          ].join(' ')}
        >
          {/* Logo + close on mobile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-[var(--inverted-text)]">
                D
              </div>
              <span className="font-['Space_Grotesk',sans-serif] text-lg font-semibold tracking-tight text-white">
                DevFlow
              </span>
            </div>
            <button
              aria-label="Fechar menu de navegacao"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
              onClick={closeMobile}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-9 flex items-center gap-3 border-y border-white/10 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="mt-0.5 text-[11px] text-white/45">Espaço pessoal</p>
            </div>
          </div>

          <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Menu principal</p>
          <nav aria-label="Navegação principal" className="flex-1 space-y-1">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
              <NavLink
                key={path}
                to={path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition duration-200',
                    isActive
                      ? 'bg-[var(--sidebar-active)] text-white shadow-sm'
                      : 'text-white/60 hover:bg-white/[0.07] hover:text-white',
                  ].join(' ')
                }
              >
                <Icon className="h-[17px] w-[17px] opacity-75 group-hover:opacity-100" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
            <p className="text-xs font-medium text-white/85">Os teus dados são locais</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">Este espaço guarda tudo neste navegador. Exporta cópias para manter o teu histórico.</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-16 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/90 px-4 py-4 backdrop-blur-xl md:px-8 md:py-5 lg:top-0 lg:px-10">
            <div className="flex w-full items-center justify-between gap-6">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)] md:text-[11px]">{heading.eyebrow}</p>
                <h2 className="mt-1 text-xl font-semibold leading-tight tracking-[-0.04em] text-[var(--text-primary)] sm:text-2xl md:text-[28px]" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                  {heading.title}
                </h2>
                <p className="mt-1 hidden text-xs text-[var(--text-muted)] md:block">{heading.subtitle}</p>
              </div>

              <div className="flex items-center gap-1.5 md:gap-2">
                <button
                  aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--brand)]"
                  onClick={() => void handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
                  type="button"
                >
                  {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <span className="hidden truncate text-xs text-[var(--text-muted)] sm:inline max-w-[100px] md:max-w-[160px]">{displayName}</span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 md:px-8 md:py-7 lg:px-10 lg:py-8">
            <div className="w-full">
              <p className="mb-6 flex items-start gap-2.5 rounded-xl border border-[var(--alert-warning-border)] bg-[var(--alert-warning-bg)] px-4 py-3 text-xs leading-relaxed text-[var(--text-secondary)] sm:items-center">
                <span className="mt-0.5 shrink-0 font-semibold text-[var(--color-warning)] sm:mt-0">Atenção</span>
                <span>Os dados ficam neste navegador. Se apagares os dados do site, o histórico desaparece sem recuperação. Exporta uma cópia regularmente.</span>
              </p>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
