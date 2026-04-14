import { useState, useEffect, useMemo } from 'react'
import useApp from './useApp'
import { getIndexSettings as getIndexSettingsService } from '../service/indexService'

const useIndex = () => {
  const { ToastMsgError } = useApp()
  const [indexDatos, setIndexDatos] = useState({})

  useEffect(() => {
    getIndexSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getIndexSettings = () => {
    getIndexSettingsService()
      .then(datos => { if (datos.code === 1) setIndexDatos(datos.data) })
      .catch(err => ToastMsgError(`Error al cargar los datos: ${err}`, 5000))
  }

  const wifiStatus   = useMemo(() => indexDatos.wifi_online ? 'Online' : 'Offline', [indexDatos.wifi_online])
  const mqttStatus   = useMemo(() => indexDatos.mqtt_online ? 'Online' : 'Offline', [indexDatos.mqtt_online])
  const wifiConn     = useMemo(() => indexDatos.wifi_online ? 'CONECTADO' : 'DESCONECTADO', [indexDatos.wifi_online])
  const mqttConn     = useMemo(() => indexDatos.mqtt_online ? 'CONECTADO' : 'DESCONECTADO', [indexDatos.mqtt_online])
  const wifiClass01  = useMemo(() => indexDatos.wifi_online ? 'badge bg-success' : 'badge bg-danger', [indexDatos.wifi_online])
  const mqttClass01  = useMemo(() => indexDatos.mqtt_online ? 'badge bg-success' : 'badge bg-danger', [indexDatos.mqtt_online])
  const wifiClass02  = useMemo(() => indexDatos.wifi_online ? 'bg-success' : 'bg-danger', [indexDatos.wifi_online])
  const mqttClass02  = useMemo(() => indexDatos.mqtt_online ? 'bg-success' : 'bg-danger', [indexDatos.mqtt_online])
  const wifiClass03  = useMemo(() => indexDatos.wifi_online ? 'bg-success' : 'bg-danger', [indexDatos.wifi_online])
  const mqttClass03  = useMemo(() => indexDatos.mqtt_online ? 'bg-success' : 'bg-danger', [indexDatos.mqtt_online])
  const spiffsUsed   = useMemo(() => {
    const v = (indexDatos.device_spiffs_used * 100) / indexDatos.device_spiffs_total
    return isNaN(v) ? 0 : v
  }, [indexDatos.device_spiffs_used, indexDatos.device_spiffs_total])
  const ramFree      = useMemo(() => {
    const v = (indexDatos.device_ram_available * 100) / indexDatos.device_ram_size
    return isNaN(v) ? 0 : v
  }, [indexDatos.device_ram_available, indexDatos.device_ram_size])

  return {
    indexDatos,
    wifiStatus, mqttStatus,
    wifiConn, mqttConn,
    wifiClass01, mqttClass01,
    wifiClass02, mqttClass02,
    wifiClass03, mqttClass03,
    spiffsUsed, ramFree
  }
}

export default useIndex
