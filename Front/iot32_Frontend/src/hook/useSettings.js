import { useState, useEffect, useMemo, useRef } from 'react'
import useApp from './useApp'
import {
  getDeviceSettings as getDeviceSettingsService,
  postDeviceSettings as postDeviceSettingsService,
  putUserSettings as putUserSettingsService,
  uploadSettingsFile,
  uploadFirmwareFile
} from '../service/settingsService'
import { API } from '../service/api'

const useSettings = () => {
  const { ToastMsgError, ToastMsgInfo, ToastMsgWarning, ToastMsgSuccess, swal, reloadPage } = useApp()

  const [device, setDevice] = useState({ device_serial: '', device_id: '' })
  const [user, setUser] = useState({
    device_old_user: '', device_old_password: '',
    device_new_user: '', device_new_password: '', device_c_new_password: ''
  })
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ type: 'update', msg: '0' })

  useEffect(() => {
    getDeviceSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (form) => {
    if (form === 'device') {
      showAlertConfirm('Guardar Device ID', '¿Está seguro de guardar el nuevo Device ID?', 'question', 'deviceID')
    } else {
      showAlertConfirm('Guardar Usuario', '¿Está seguro de guardar las configuraciones del Usuario?', 'question', 'user')
    }
  }

  const showAlertConfirm = (title, text, icon, funct) => {
    swal.fire({
      title, text, icon,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        if (funct === 'deviceID') postDeviceSettings()
        else if (funct === 'user') putUserSettings()
        else console.log('Comando no soportado sin websockets:', funct)
      }
    })
  }

  const getDeviceSettings = async () => {
    try {
      const datos = await getDeviceSettingsService()
      if (datos.code === 1) setDevice(datos.data)
    } catch (err) { ToastMsgError(`Error: ${err}`, 5000) }
  }

  const postDeviceSettings = async () => {
    try {
      const datos = await postDeviceSettingsService(device)
      if (datos.save) { ToastMsgSuccess('Configuración del Device_ID guardada correctamente', 5000); getDeviceSettings() }
      else ToastMsgError(datos.msg, 5000)
    } catch (err) { ToastMsgError(`Error al guardar Device_ID: ${err}`, 5000) }
  }

  const putUserSettings = async () => {
    try {
      const datos = await putUserSettingsService(user)
      if (datos.save) ToastMsgSuccess(datos.msg, 5000)
      else ToastMsgError(datos.msg, 5000)
    } catch (err) { ToastMsgError(`Error al guardar Usuario: ${err}`, 5000) }
  }

  const clearUser = () => { setUser({ device_old_user: '', device_old_password: '', device_new_user: '', device_new_password: '', device_c_new_password: '' }); ToastMsgInfo('Formulario Reseteado', 5000) }

  const downloadSettings = () => {
    fetch(API('/api/settings/download')).then(t => t.blob().then(b => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b); a.setAttribute('download', 'settings.json'); a.click()
    }))
  }

  const uploadSettings = () => {
    const input = document.getElementById('inputFileAdd')
    const file = input?.files[0]
    if (!file) { ToastMsgError('Tiene que seleccionar antes un archivo', 5000); return }
    if (file.name !== 'settings.json') { ToastMsgWarning('Solo se permite el archivo (settings.json)', 5000); return }
    if (file.size > 5120) { ToastMsgWarning('El tamaño máximo permitido es de ( 5.0 KB )', 5000); return }
    const formdata = new FormData(); formdata.append('', file, file.name)
    uploadSettingsFile(formdata)
      .then(d => { if (d.save) ToastMsgSuccess('Archivo (settings.json) guardado correctamente', 5000); else ToastMsgError(d.msg, 5000) })
      .catch(e => ToastMsgError(`Error: ${e}`, 5000))
  }

  const uploadFirmware = () => {
    const input = document.getElementById('inputFileFirmware')
    const file = input?.files[0]
    if (!file) { ToastMsgError('Tiene que seleccionar antes un archivo', 5000); return }
    if (file.size > 1966080) { ToastMsgWarning('El tamaño máximo del archivo tiene que ser de ( 1.9 MB )', 5000); return }
    const formdata = new FormData(); formdata.append('', file, file.name)
    setLoading(true)
    uploadFirmwareFile(formdata)
      .then(d => {
        setLoading(false)
        if (d.save) { ToastMsgInfo(`${d.type} actualizado correctamente`, 5000); reloadPage('settings', 10000) }
        else ToastMsgError(d.msg, 5000)
      }).catch(e => { setLoading(false); ToastMsgError(`Error al actualizar: ${e}`, 5000) })
  }

  const percent = useMemo(() => `${progress.msg}%`, [progress.msg])

  return { device, setDevice, user, setUser, handleSubmit, clearUser, downloadSettings, uploadSettings, uploadFirmware, loading, progress, percent, showAlertConfirm, putUserSettings }
}

export default useSettings
