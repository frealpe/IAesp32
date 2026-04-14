import { API } from './api'

export const getWifiSettings = async () => {
  const res = await fetch(API('/api/wifi'), { headers: { Accept: 'application/json' } })
  return await res.json()
}

export const postWifiSettings = async (wifi) => {
  const res = await fetch(API('/api/wifi'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(wifi)
  })
  return await res.json()
}

export const getWifiScan = async () => {
  const res = await fetch(API('/api/scan'), { headers: { Accept: 'application/json' } })
  return await res.json()
}
