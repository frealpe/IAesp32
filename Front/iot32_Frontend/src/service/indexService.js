import { API } from './api'

export const getIndexSettings = async () => {
  const res = await fetch(API('/api/index'), { headers: { Accept: 'application/json' } })
  return await res.json()
}
