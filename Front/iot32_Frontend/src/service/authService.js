import { API } from './api'

export const loginSession = async (correo, password) => {
  return await fetch(API('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password })
  })
}

export const deleteSession = async () => {
  return await fetch(API('/api/auth/logout'), { method: 'DELETE' })
}
