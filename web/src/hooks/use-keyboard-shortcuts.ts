import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type ShortcutMap = Record<string, () => void>

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    let waitingForNavigationKey = false
    let prefixTimeout: number | undefined

    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      const hasModifier = event.metaKey || event.ctrlKey
      const target = event.target as HTMLElement | null
      const tag = target?.tagName

      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return

      if (waitingForNavigationKey) {
        window.clearTimeout(prefixTimeout)
        waitingForNavigationKey = false
        const match = Object.entries(shortcuts).find(([pattern]) => pattern.startsWith('g+') && pattern.slice(2).toLowerCase() === key)
        if (match && !hasModifier) {
          event.preventDefault()
          match[1]()
          return
        }
      }

      if (!hasModifier && key === 'g' && Object.keys(shortcuts).some((pattern) => pattern.startsWith('g+'))) {
        event.preventDefault()
        waitingForNavigationKey = true
        prefixTimeout = window.setTimeout(() => { waitingForNavigationKey = false }, 1200)
        return
      }

      for (const [pattern, handler] of Object.entries(shortcuts)) {
        if (pattern.startsWith('g+')) continue
        const [mod, shortcutKey] = pattern.includes('+') ? pattern.split('+') : ['', pattern]
        const modMatch = mod === 'meta' ? hasModifier : !mod
        if (modMatch && key === shortcutKey.toLowerCase()) {
          event.preventDefault()
          handler()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(prefixTimeout)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}

export function useNavigationShortcuts() {
  const navigate = useNavigate()

  useKeyboardShortcuts({
    'g+d': () => navigate('/dashboard'),
    'g+p': () => navigate('/projetos'),
    'g+f': () => navigate('/financas'),
    'g+i': () => navigate('/investimentos'),
    'g+t': () => navigate('/timer'),
    'g+,': () => navigate('/config'),
  })
}
