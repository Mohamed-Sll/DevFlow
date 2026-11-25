export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()

  // Deixa o navegador iniciar a transferência antes de libertar o endereço temporário.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
