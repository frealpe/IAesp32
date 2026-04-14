import { API } from './api'

export const getDeviceSettings = async () => {
  const res = await fetch(API('/api/settings/id'), { headers: { Accept: 'application/json' } })
  return await res.json()
}

export const postDeviceSettings = async (device) => {
  const res = await fetch(API('/api/settings/id'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(device)
  })
  return await res.json()
}

export const putUserSettings = async (user) => {
  const res = await fetch(API('/api/settings/user'), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  })
  return await res.json()
}

export const uploadSettingsFile = async (formdata) => {
  const res = await fetch(API('/api/settings/upload'), { method: 'POST', body: formdata })
  return await res.json()
}

export const uploadFirmwareFile = async (formdata) => {
  const res = await fetch(API('/api/settings/firmware'), { method: 'POST', body: formdata })
  return await res.json()
}
