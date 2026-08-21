const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function createLocalReference(prefix = 'CV') {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const random = Array.from(crypto.getRandomValues(new Uint8Array(6)), (n) => alphabet[n % alphabet.length]).join('')
  return `${prefix}-${date}-${random}`
}
