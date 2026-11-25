export function readBrowserPreference(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    // Alguns modos privados bloqueiam localStorage; a aplicação continua a abrir.
    return null
  }
}

export function saveBrowserPreference(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    // A preferência pode continuar guardada na base local IndexedDB.
    return false
  }
}
