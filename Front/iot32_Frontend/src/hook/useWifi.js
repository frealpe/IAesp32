import { useState, useEffect, useMemo } from 'react'
import useApp from './useApp'
import {
  getWifiSettings as getWifiSettingsService,
  postWifiSettings as postWifiSettingsService,
  getWifiScan as getWifiScanService
} from '../service/wifiService'

const useWifi = () => {
  const { ToastMsg, ToastMsgError, ToastMsgWarning, ToastMsgSuccess, swal } = useApp()

  const [wifi, setWifi] = useState({
    wifi_ssid: 'iotmaster', wifi_password: '',
    wifi_ip_static: false, wifi_ipv4: '',
    wifi_subnet: '', wifi_gateway: '',
    wifi_dns_primary: '', wifi_dns_secondary: '',
    ap_mode: false, ap_ssid: '',
    ap_password: '', ap_visibility: false,
    ap_chanel: 0, ap_connect: 0
  })
  const [networks, setNetworks] = useState({})
  const [count, setCount] = useState(0)
  const [scan, setScan] = useState(false)
  const [find, setFind] = useState(0)

  useEffect(() => { getWifiSettings() }, [])

  const handleSubmit = () => {
    swal.fire({
      title: 'Guardar WiFi',
      text: '¿Está seguro de guardar las configuraciones WiFi?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    }).then(result => { if (result.isConfirmed) postWifiSettings() })
  }

  const getWifiSettings = async () => {
    try {
      const datos = await getWifiSettingsService()
      if (datos.code === 1) setWifi(datos.wifi)
      else ToastMsgError('Error: datos no válidos', 5000)
    } catch (err) { ToastMsgError(`Error: ${err}`, 5000) }
  }

  const postWifiSettings = async () => {
    try {
      const datos = await postWifiSettingsService(wifi)
      if (datos.save) { ToastMsgSuccess('Configuración WiFi guardada correctamente', 5000); getWifiSettings() }
    } catch (err) { ToastMsgError(`Error: ${err}`, 5000) }
  }

  const getWifiScan = async () => {
    setScan(true); setFind(0); setCount(0); setNetworks({})
    try {
      const datos = await getWifiScanService()
      setNetworks(datos)
      setFind(datos.code)
      setCount(datos.meta?.count || 0)
      setScan(false)
      if (datos.code > 0) ToastMsg(`${datos.meta?.count} Redes WiFi encontradas`, 5000)
      else ToastMsgWarning('No se encontraron Redes WiFi cercanas', 5000)
    } catch (err) { setScan(false); ToastMsgError(`Error: ${err}`, 5000) }
  }

  const seguridad = (seg) => seg === 'Open'
    ? 'fa fa-fw fa-lock-open text-success'
    : 'fa fa-fw fa-lock text-danger'

  const selectWiFi = (ssid) => {
    setWifi(prev => ({ ...prev, wifi_ssid: ssid }))
    ToastMsg(`Red ( ${ssid} ) seleccionada`, 5000)
  }

  const wifiIpStatic = useMemo(() => wifi.wifi_ip_static ? 'Si' : 'No', [wifi.wifi_ip_static])
  const apMode       = useMemo(() => wifi.ap_mode ? 'Si' : 'No', [wifi.ap_mode])
  const apVisibility = useMemo(() => wifi.ap_visibility ? 'Si' : 'No', [wifi.ap_visibility])
  const scanning     = useMemo(() => scan ? 'Escaneando redes WiFi cercanas' : 'Ninguna Red WiFi Encontrada', [scan])

  return { wifi, setWifi, count, scan, find, networks, wifiIpStatic, apMode, apVisibility, scanning, handleSubmit, getWifiScan, seguridad, selectWiFi }
}

export default useWifi
