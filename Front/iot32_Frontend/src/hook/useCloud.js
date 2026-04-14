import { useState, useEffect, useMemo } from 'react'
import useApp from './useApp'
import {
  getCloudSettings as getCloudSettingsService,
  postCloudSettings as postCloudSettingsService,
  testHttpSettings as testHttpSettingsService,
  testCloudEndpoint
} from '../service/cloudService'

const useCloud = () => {
  const { ToastMsgError, ToastMsgSuccess, swal } = useApp()

  const [data, setData] = useState({
    connection: {
      mqtt_cloud_enable: false, mqtt_user: '', mqtt_password: '',
      mqtt_server: '', mqtt_cloud_id: '', mqtt_port: 0,
      mqtt_retain: false, mqtt_qos: 0,
      mqtt_topic_publish: 'cat1/acb/up', mqtt_topic_subscribe: 'cat1/acb/down/imei'
    },
    datos: { mqtt_time_send: false, mqtt_time_interval: 0, mqtt_time_unit: 1, mqtt_status_send: false, mqtt_custom_message: '' },
    http_connection: {
      http_cloud_enable: false, http_server: '', http_port: 80,
      http_path: '', http_user_name: '', http_password: '',
      http_auth_path: '', http_register_path: '', http_save_index_path: '',
      http_save_alarm_path: '', http_save_batch_path: '', http_get_index_path: '',
      http_get_meters_path: '', http_encrypt_test_path: ''
    },
    http_datos: { 
      http_time_send: false, http_time_interval: 0, http_time_unit: 1, http_status_send: false,
      http_encrypt_key: '', http_encrypt_iv: ''
    }
  })

  const [hasToken, setHasToken] = useState(false)
  const [token, setToken] = useState('')
  const [meterIndexTest, setMeterIndexTest] = useState('80')

  useEffect(() => { getCloudSettings() }, [])

  const handleSubmit = (form) => {
    let title = 'Guardar Parámetros'
    let text = '¿Está seguro de guardar estos parámetros?'

    if (form === 'connection') {
      title = 'Guardar Conexión MQTT'
      text = '¿Está seguro de guardar los parámetros de la Conexión MQTT?'
    } else if (form === 'data') {
      title = 'Guardar Datos MQTT'
      text = '¿Está seguro de guardar los parámetros del envío de Datos MQTT?'
    } else if (form === 'http_connection') {
      title = 'Guardar Conexión HTTP'
      text = '¿Está seguro de guardar los parámetros de la Conexión HTTP?'
    } else if (form === 'http_data') {
      title = 'Guardar Datos HTTP'
      text = '¿Está seguro de guardar los parámetros del envío de Datos HTTP?'
    }

    swal.fire({
      title: title,
      text: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        // Map http_connection -> connection and http_data -> data for the service
        const serviceUrl = form.includes('http') ? (form.includes('connection') ? 'connection' : 'data') : form
        postCloudSettings(serviceUrl)
      }
    })
  }

  const getCloudSettings = async () => {
    try {
      const datos = await getCloudSettingsService()
      if (datos.code === 1) {
        setData({
          ...datos.data,
          meta: datos.meta
        })
      }
    } catch (err) { ToastMsgError(`Error al cargar los datos: ${err}`, 5000) }
  }

  const postCloudSettings = async (cloudUrl) => {
    try {
      const datos = await postCloudSettingsService(cloudUrl, data)
      if (datos.save) {
        const msg = cloudUrl === 'connection' ? 'de la Conexión' : 'de los Datos'
        ToastMsgSuccess(`Configuración ${msg} Cloud guardada correctamente`, 5000)
        getCloudSettings()
      }
    } catch (err) { ToastMsgError(`Error al guardar los parámetros Cloud: ${err}`, 5000) }
  }

  // Al activar HTTP → desactiva MQTT automáticamente (exclusión mutua)
  const updateHttpConn = (field, value) =>
    setData(prev => ({
      ...prev,
      http_connection: { ...prev.http_connection, [field]: value },
      // Si se está habilitando HTTP, deshabilitar MQTT
      ...(field === 'http_cloud_enable' && value === true
        ? { connection: { ...prev.connection, mqtt_cloud_enable: false } }
        : {})
    }))

  const updateHttpDatos = (field, value) =>
    setData(prev => ({ ...prev, http_datos: { ...prev.http_datos, [field]: value } }))

  // Al activar MQTT → desactiva HTTP automáticamente (exclusión mutua)
  const updateConn = (field, value) =>
    setData(prev => ({
      ...prev,
      connection: { ...prev.connection, [field]: value },
      // Si se está habilitando MQTT, deshabilitar HTTP
      ...(field === 'mqtt_cloud_enable' && value === true
        ? { http_connection: { ...prev.http_connection, http_cloud_enable: false } }
        : {})
    }))

  const updateDatos = (field, value) =>
    setData(prev => ({ ...prev, datos: { ...prev.datos, [field]: value } }))

  const testHttp = async () => {
    try {
      const res = await testHttpSettingsService()
      if (res.code === 200 || res.code === 1) { // Adjusted for token response codes
        swal.fire({
          title: 'Prueba Exitosa',
          html: `<p>Respuesta:</p><pre style="text-align:left; background:#f4f4f4; padding:10px; font-size:12px; max-height:300px; overflow:auto;">${JSON.stringify(res.response, null, 2)}</pre>`,
          icon: 'success'
        })
      } else {
        swal.fire({
          title: 'Prueba Fallida',
          text: `Código HTTP: ${res.code}. Mensaje: ${res.status || 'Error desconocido'}`,
          icon: 'error'
        })
      }
    } catch (err) {
      ToastMsgError(`Error en la prueba: ${err}`, 5000)
    }
  }

  const testEndpoint = async (pathLabel, pathValue, method) => {
    try {
      ToastMsgSuccess(`Iniciando prueba de ${pathLabel}...`, 2000)
      
      // Si es Save Index, pasamos el valor personalizado
      const extraValue = pathValue === data.http_connection?.http_save_index_path ? meterIndexTest : ''
      
      const res = await testCloudEndpoint(pathValue, method, extraValue)
      if (res.code >= 200 && res.code < 300) {
        // Si es el endpoint de autenticación y fue exitoso, habilitamos el resto
        if (pathValue === data.http_connection?.http_auth_path) {
          setHasToken(true)
          if (res.response && res.response.access_token) {
            setToken(res.response.access_token)
          }
        }
        
        swal.fire({
          title: `Prueba ${pathLabel} Exitosa`,
          html: `
            <div style="text-align:left; font-size:12px;">
              <p><b>Respuesta (${res.code}):</b></p>
              <pre style="background:#f4f4f4; padding:10px; max-height:200px; overflow:auto;">${JSON.stringify(res.response, null, 2)}</pre>
              ${res.headers ? `
                <p><b>Headers:</b></p>
                <pre style="background:#e9ecef; padding:10px; max-height:150px; overflow:auto;">${JSON.stringify(res.headers, null, 2)}</pre>
              ` : ''}
            </div>
          `,
          icon: 'success',
          width: '600px'
        })
      } else {
        swal.fire({
          title: `Prueba ${pathLabel} Fallida`,
          html: `
            <div style="text-align:left; font-size:12px;">
              <p>Código HTTP: ${res.code}</p>
              <p>Status: ${res.status}</p>
              <pre style="background:#f4f4f4; padding:10px; max-height:200px; overflow:auto;">${JSON.stringify(res.response, null, 2)}</pre>
              ${res.headers ? `
                <p><b>Headers:</b></p>
                <pre style="background:#e9ecef; padding:10px; max-height:150px; overflow:auto;">${JSON.stringify(res.headers, null, 2)}</pre>
              ` : ''}
            </div>
          `,
          icon: 'error',
          width: '600px'
        })
      }
    } catch (err) {
      ToastMsgError(`Error en la prueba: ${err}`, 5000)
    }
  }

  const cloudEnable = useMemo(() => data.connection?.mqtt_cloud_enable ? 'Si' : 'No', [data.connection?.mqtt_cloud_enable])

  const httpCloudEnable = useMemo(() => data.http_connection?.http_cloud_enable ? 'Si' : 'No', [data.http_connection?.http_cloud_enable])

  return { data, setData, hasToken, token, meterIndexTest, setMeterIndexTest, cloudEnable, httpCloudEnable, handleSubmit, updateConn, updateDatos, updateHttpConn, updateHttpDatos, testHttp, testEndpoint }
}

export default useCloud
