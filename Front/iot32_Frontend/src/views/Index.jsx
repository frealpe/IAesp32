import React from 'react'
import { CContainer, CCard, CCardBody, CProgress, CTable, CTableBody, CTableRow, CTableDataCell, CBadge } from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import {
    cilBarcode,
    cilCloud,
    cilWifiSignal4,
    cilSignalCellular4,
    cilMemory,
    cilSatelite,
    cilGlobeAlt,
    cilStorage,
    cilReload,
    cilClock
} from '@coreui/icons'
import useIndex from '../hook/useIndex'

const Index = () => {
    const {
        indexDatos, wifiStatus, mqttStatus, wifiConn, mqttConn,
        wifiClass01, mqttClass01, wifiClass02, mqttClass02, wifiClass03, mqttClass03,
        spiffsUsed, ramFree
    } = useIndex()

    return (
        <CContainer fluid className="px-2">
            {/* Top stat cards */}
            <div className="row g-2 mb-2 mt-1">
                <div className="col-md-6 col-xl-3">
                    <CCard className="text-white bg-primary h-100">
                        <CCardBody className="d-flex align-items-center justify-content-between p-2">
                            <CIcon icon={cilBarcode} size="xl" className="opacity-75" />
                            <div className="text-end">
                                <p className="fs-6 fw-medium mb-0">Dispositivo</p>
                                <p className="mb-0 small opacity-75">{indexDatos.device_serial || 'ESP3200000000000'}</p>
                            </div>
                        </CCardBody>
                    </CCard>
                </div>
                <div className="col-md-6 col-xl-3">
                    <CCard className={`text-white h-100 ${mqttClass03}`}>
                        <CCardBody className="d-flex align-items-center justify-content-between p-2">
                            <CIcon icon={cilCloud} size="xl" className="opacity-75" />
                            <div className="text-end">
                                <p className="fs-6 fw-medium mb-0">Protocolo</p>
                                <p className="mb-0 small opacity-75">({indexDatos.mqtt_server || 'N/A'}) - {mqttStatus}</p>
                            </div>
                        </CCardBody>
                    </CCard>
                </div>
                <div className="col-md-6 col-xl-3">
                    <CCard className={`text-white h-100 ${wifiClass03}`}>
                        <CCardBody className="d-flex align-items-center justify-content-between p-2">
                            <div className="text-start">
                                <p className="fs-6 fw-medium mb-0">WiFi</p>
                                <p className="mb-0 small opacity-75">({indexDatos.wifi_ssid || 'N/A'}) - {wifiStatus}</p>
                            </div>
                            <CIcon icon={cilWifiSignal4} size="xl" className="opacity-75" />
                        </CCardBody>
                    </CCard>
                </div>
                <div className="col-md-6 col-xl-3">
                    <CCard className="text-white bg-warning h-100">
                        <CCardBody className="d-flex align-items-center justify-content-between p-2">
                            <div className="text-start">
                                <p className="fs-6 fw-medium mb-0">WiFi RSSI</p>
                                <p className="mb-0 small opacity-75">{indexDatos.wifi_rssi} dBm</p>
                            </div>
                            <CIcon icon={cilSignalCellular4} size="xl" className="opacity-75" />
                        </CCardBody>
                    </CCard>
                </div>
            </div>

            {/* Stats row */}
            <div className="row g-2 mb-3">
                <div className="col-md-6">
                    <CCard>
                        <CCardBody className="p-2">
                            <div className="row text-center">
                                <div className="col-4 border-end">
                                    <div className="py-1">
                                        <CIcon icon={cilMemory} size="xl" className="text-primary mb-1" />
                                        <p className="fs-6 fw-medium mb-0">{ramFree.toFixed(2)} %</p>
                                        <p className="text-muted small mb-0" style={{ fontSize: '0.7em' }}>RAM Disponible</p>
                                    </div>
                                </div>
                                <div className="col-4 border-end">
                                    <div className="py-1">
                                        <CIcon icon={cilSatelite} size="xl" className="text-primary mb-1" />
                                        <p className="fs-6 fw-medium mb-0">{indexDatos.wifi_signal || 0} %</p>
                                        <p className="text-muted small mb-0" style={{ fontSize: '0.7em' }}>Señal WiFi</p>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="py-1">
                                        <CIcon icon={cilGlobeAlt} size="xl" className="text-primary mb-1" />
                                        <p className="fs-6 fw-medium mb-0">{indexDatos.mqtt_activity || 'Unknown'}</p>
                                        <p className="text-muted small mb-0" style={{ fontSize: '0.7em' }}>Protocolo</p>
                                    </div>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </div>
                <div className="col-md-6">
                    <CCard className="text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <CCardBody className="p-2">
                            <div className="row text-center">
                                <div className="col-4 border-end">
                                    <div className="py-1">
                                        <CIcon icon={cilStorage} size="xl" className="mb-1 opacity-75" />
                                        <p className="fs-6 fw-medium mb-0">{spiffsUsed.toFixed(2)} %</p>
                                        <p className="opacity-75 mb-0" style={{ fontSize: '0.7em' }}>SPIFFS Usada</p>
                                    </div>
                                </div>
                                <div className="col-4 border-end">
                                    <div className="py-1">
                                        <CIcon icon={cilReload} size="xl" className="mb-1 opacity-75" />
                                        <p className="fs-6 fw-medium mb-0">{indexDatos.device_restart || 0}</p>
                                        <p className="opacity-75 mb-0" style={{ fontSize: '0.7em' }}>Reinicios</p>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="py-1">
                                        <CIcon icon={cilClock} size="xl" className="mb-1 opacity-75" />
                                        <p className="fs-6 fw-medium mb-0">{indexDatos.device_time_active || '0:00:00:00'}</p>
                                        <p className="opacity-75 mb-0" style={{ fontSize: '0.7em' }}>Tiempo Activo</p>
                                    </div>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </div>
            </div>

            {/* Cloud & WiFi tables */}
            <div className="row g-2 mb-3">
                <div className="col-md-6">
                    <CCard>
                        <div className={`progress rounded-0`} style={{ height: 3 }}>
                            <div className={`progress-bar ${mqttClass02}`} style={{ width: '100%' }} />
                        </div>
                        <CCardBody className="p-2">
                            <p className="fw-semibold mb-1 small">Protocolo</p>
                            <CTable striped borderless small className="mb-0" style={{ fontSize: '0.85em' }}>
                                <CTableBody>
                                    <CTableRow><CTableDataCell className="py-1">Estado MQTT:</CTableDataCell><CTableDataCell className="py-1"><CBadge color={indexDatos.mqtt_online ? 'success' : 'danger'}>{mqttConn}</CBadge></CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Servidor MQTT:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.mqtt_server || 'N/A'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Usuario MQTT:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.mqtt_user || 'N/A'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Cliente ID MQTT:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.mqtt_cloud_id || 'ESP3200000000000'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Actividad:</CTableDataCell><CTableDataCell className="py-1"><CBadge color="secondary">{indexDatos.mqtt_activity || 'Unknown'}</CBadge></CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Ruta del Tópico:</CTableDataCell><CTableDataCell className="py-1">v1/devices/{indexDatos.mqtt_user}/{indexDatos.device_serial}/#</CTableDataCell></CTableRow>
                                </CTableBody>
                            </CTable>
                        </CCardBody>
                    </CCard>
                </div>
                <div className="col-md-6">
                    <CCard>
                        <div className="progress rounded-0" style={{ height: 3 }}>
                            <div className={`progress-bar ${wifiClass02}`} style={{ width: '100%' }} />
                        </div>
                        <CCardBody className="p-2">
                            <p className="fw-semibold mb-1 small">Inalámbrico</p>
                            <CTable striped borderless small className="mb-0" style={{ fontSize: '0.85em' }}>
                                <CTableBody>
                                    <CTableRow><CTableDataCell className="py-1">Estado WiFi:</CTableDataCell><CTableDataCell className="py-1"><CBadge color={indexDatos.wifi_online ? 'success' : 'danger'}>{wifiConn}</CBadge></CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">SSID WiFi:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.wifi_ssid || 'N/A'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">IP WiFi:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.wifi_ipv4 || '000.000.000.000'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">MAC WiFi:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.wifi_mac || '00:00:00:00:00:00'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">RSSI WiFi:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.wifi_rssi || 0} dBm</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Modo WiFi:</CTableDataCell><CTableDataCell className="py-1"><CBadge color="primary">{indexDatos.wifi_mode || 'Unknown'}</CBadge></CTableDataCell></CTableRow>
                                </CTableBody>
                            </CTable>
                        </CCardBody>
                    </CCard>
                </div>
            </div>

            {/* Hardware & Software */}
            <div className="row mb-2">
                <div className="col-12">
                    <CCard>
                        <div className="progress rounded-0" style={{ height: 3 }}>
                            <div className="progress-bar bg-info" style={{ width: '100%' }} />
                        </div>
                        <CCardBody className="p-2">
                            <p className="fw-semibold mb-1 small">Hardware &amp; Software</p>
                            <CTable striped borderless small className="mb-0" style={{ fontSize: '0.85em' }}>
                                <CTableBody>
                                    <CTableRow><CTableDataCell className="py-1" style={{ width: '40%' }}>Número de Serie:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_serial || 'ESP3200000000000'}</CTableDataCell>
                                        <CTableDataCell className="py-1 border-start ps-3" style={{ width: '30%' }}>Versión del Firmware:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_fw_version || 'v0.0.00-Build-00000000'}</CTableDataCell></CTableRow>

                                    <CTableRow><CTableDataCell className="py-1">SDK:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_sdk || 'v0.0.0-0-000000000'}</CTableDataCell>
                                        <CTableDataCell className="py-1 border-start ps-3">Versión del Hardware:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_hw_version || 'ADMINIIOT32 v0'}</CTableDataCell></CTableRow>

                                    <CTableRow><CTableDataCell className="py-1">CPU FREQ:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_cpu_clock || 0} MHz</CTableDataCell>
                                        <CTableDataCell className="py-1 border-start ps-3">RAM SIZE:</CTableDataCell><CTableDataCell className="py-1">{(indexDatos.device_ram_size / 1000 || 35.08).toFixed(2)} KB</CTableDataCell></CTableRow>

                                    <CTableRow><CTableDataCell className="py-1">FLASH SIZE:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_flash_size || 4.0} MB</CTableDataCell>
                                        <CTableDataCell className="py-1 border-start ps-3">SPIFFS SIZE:</CTableDataCell><CTableDataCell className="py-1">{(indexDatos.device_spiffs_total / 1000 || 15.31).toFixed(2)} KB</CTableDataCell></CTableRow>

                                    <CTableRow><CTableDataCell className="py-1">SPIFFS USED:</CTableDataCell><CTableDataCell className="py-1">{(indexDatos.device_spiffs_used / 1000 || 0).toFixed(2)} KB</CTableDataCell>
                                        <CTableDataCell className="py-1 border-start ps-3">Fabricante:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_manufacturer || 'IOTHOST'}</CTableDataCell></CTableRow>
                                </CTableBody>
                            </CTable>
                        </CCardBody>
                    </CCard>
                </div>
            </div>
        </CContainer>
    )
}

export default Index
