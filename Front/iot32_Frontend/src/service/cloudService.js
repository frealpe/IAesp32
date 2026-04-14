import { API } from './api'

export const getCloudSettings = async () => {
  const res = await fetch(API('/api/cloud'), { headers: { Accept: 'application/json' } })
  return await res.json()
}

export const postCloudSettings = async (cloudUrl, data) => {
  const res = await fetch(API(`/api/cloud/${cloudUrl}`), {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  })
  return await res.json()
}

export const testHttpSettings = async () => {
  const res = await fetch(API('/api/cloud/test-http'), {
    method: 'POST',
    headers: { Accept: 'application/json' }
  })
  return await res.json()
}

export const testCloudEndpoint = async (path, method, value = '') => {
  const res = await fetch(API('/api/cloud/test-endpoint'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, method, value })
  })
  return await res.json()
}

export const publishMqttMessage = async (topic, message) => {
  const res = await fetch(API('/api/mqtt/publish'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, message })
  })
  return await res.json()
}
