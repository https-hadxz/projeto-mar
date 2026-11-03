import { auth } from '../stores/auth'

export const API_URL = (
  import.meta.env.VITE_API_URL || 'https://projeto-mar.onrender.com'
).replace(/\/$/, '')

export function fotoUrl(id, versao = '') {
  return `${API_URL}/api/animals/${id}/photo?v=${encodeURIComponent(versao)}`
}

export function avatarUrl(id, versao = 0) {
  return `${API_URL}/api/users/${id}/avatar?v=${encodeURIComponent(versao)}`
}

export function bannerUrl(id, versao = 0) {
  return `${API_URL}/api/users/${id}/banner?v=${encodeURIComponent(versao)}`
}

export async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }

  if (auth.token) {
    headers.Authorization = `Bearer ${auth.token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  let data = null
  try {
    data = await res.json()
  } catch (e) {
    throw new Error('O servidor não respondeu como esperado. Tente de novo em instantes.')
  }

  if (!res.ok) {
    if ((res.status === 401 || data.code === 'banned') && auth.token) {
      auth.logout()
    }
    throw new Error(data.message || `Erro ${res.status}`)
  }

  return data
}