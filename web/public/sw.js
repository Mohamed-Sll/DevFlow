const APP_SHELL = ['/index.html', '/favicon.svg']
const CACHE_MARKER = '/__devflow-cache-version__'

async function getPrecacheFiles() {
  const response = await fetch('/asset-manifest.json', { cache: 'no-store' })
  if (!response.ok) throw new Error('Não foi possível ler o manifesto dos ficheiros.')

  const manifest = await response.json()
  const files = Object.values(manifest).flatMap((entry) => [
    entry.file,
    ...(entry.css || []),
    ...(entry.assets || []),
  ])
  const assets = [...new Set([...APP_SHELL, ...files.filter((file) => typeof file === 'string').map((file) => `/${file}`)])]
  // O hash muda com os nomes fingerprinted do Vite e permite remover a versão anterior.
  const version = assets.slice().sort().join('|').split('').reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261).toString(36)
  return { assets, cacheName: `devflow-${version}` }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    getPrecacheFiles()
      .then(async ({ assets, cacheName }) => {
        const cache = await caches.open(cacheName)
        await cache.addAll(assets)
        await cache.put(CACHE_MARKER, new Response(cacheName))
      })
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      const entries = await Promise.all(keys.map(async (key) => {
        const cache = await caches.open(key)
        const marker = await cache.match(CACHE_MARKER)
        return { cache, key, marker }
      }))
      const current = entries.find((entry) => entry.marker)
      const currentName = current ? await current.marker.text() : null
      await Promise.all(entries
        .filter((entry) => entry.key.startsWith('devflow-') && entry.key !== currentName)
        .map((entry) => caches.delete(entry.key)))
    })
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Só guardo ficheiros da própria aplicação. Os dados de trabalho ficam no IndexedDB.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const shell = await caches.match('/index.html')
        return shell || Response.error()
      }),
    )
    return
  }

  if (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.svg') {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached

        const response = await fetch(request)
        if (response.ok) {
          const cacheNames = await caches.keys()
          const cacheName = cacheNames.find((name) => name.startsWith('devflow-'))
          if (!cacheName) return response
          const cache = await caches.open(cacheName)
          await cache.put(request, response.clone())
        }
        return response
      }),
    )
  }
})
