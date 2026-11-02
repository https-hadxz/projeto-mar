const API_URL = (
  import.meta.env.VITE_API_URL || 'https://projeto-mar.onrender.com'
).replace(/\/$/, '')

export async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })

  let data = null
  try {
    data = await res.json()
  } catch (e) {
    throw new Error('O servidor não respondeu como esperado. Tente de novo em instantes.')
  }

  if (!res.ok) throw new Error(data.message || `Erro ${res.status}`)
  return data
}