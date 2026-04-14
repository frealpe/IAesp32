import React from 'react'
import { CContainer, CCard, CCardBody, CCardHeader, CForm, CFormLabel, CFormInput, CFormCheck, CButton, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CCollapse, CBadge, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSettings, cilSave, cilWifiSignal4, cilSearch, cilCheck, cilLockLocked } from '@coreui/icons'
import useWifi from '../hook/useWifi'
import { useState } from 'react'

const WiFi = () => {
    const {
        wifi, setWifi, count, scan, find, networks,
        wifiIpStatic, apMode, apVisibility, scanning,
        handleSubmit, getWifiScan, seguridad, selectWiFi
    } = useWifi()

    const [showAdvancedIP, setShowAdvancedIP] = useState(false)
    const [showAdvancedAP, setShowAdvancedAP] = useState(false)

    const update = (field, value) => setWifi(prev => ({ ...prev, [field]: value }))

    return (
        <CContainer fluid className="px-4">
            <h4 className="mb-4">Configuración de la red inalámbrica</h4>
            <div className="row g-3">
                {/* Connectivity Form */}
                <div className="col-md-4">
                    <CCard>
                        <CCardHeader className="bg-primary text-white fw-semibold">Conectividad</CCardHeader>
                        <CCardBody>
                            <CForm onSubmit={e => { e.preventDefault(); handleSubmit() }}>
                                <div className="mb-3">
                                    <CFormLabel>SSID</CFormLabel>
                                    <CFormInput placeholder="iotmaster" value={wifi.wifi_ssid} onChange={e => update('wifi_ssid', e.target.value)} />
                                </div>
                                <div className="mb-3">
                                    <CFormLabel>Contraseña</CFormLabel>
                                    <CFormInput type="password" placeholder="*****" value={wifi.wifi_password} onChange={e => update('wifi_password', e.target.value)} />
                                </div>

                                <div className="mb-2">
                                    <button type="button" className="btn btn-link p-0 text-primary d-flex align-items-center" onClick={() => setShowAdvancedIP(v => !v)}>
                                        <CIcon icon={cilSettings} className="me-1" /> Opciones Avanzadas IP
                                    </button>
                                    <CCollapse visible={showAdvancedIP}>
                                        <div className="mt-2 ps-2 border-start">
                                            <div className="mb-2">
                                                <CFormLabel>DHCP</CFormLabel>
                                                <CFormCheck type="switch" label={wifiIpStatic} checked={wifi.wifi_ip_static} onChange={e => update('wifi_ip_static', e.target.checked)} />
                                            </div>
                                            {['wifi_ipv4', 'wifi_subnet', 'wifi_gateway', 'wifi_dns_primary', 'wifi_dns_secondary'].map(field => (
                                                <div className="mb-2" key={field}>
                                                    <CFormLabel>{field.replace(/_/g, ' ').toUpperCase()}</CFormLabel>
                                                    <CFormInput placeholder={field} value={wifi[field]} onChange={e => update(field, e.target.value)} />
                                                </div>
                                            ))}
                                        </div>
                                    </CCollapse>
                                </div>

                                <div className="mb-2">
                                    <CFormLabel>Modo-AP</CFormLabel>
                                    <CFormCheck type="switch" label={apMode} checked={wifi.ap_mode} onChange={e => update('ap_mode', e.target.checked)} />
                                </div>
                                <div className="mb-2">
                                    <CFormLabel>SSID AP</CFormLabel>
                                    <CFormInput placeholder="ESP329B1C52100C3D" value={wifi.ap_ssid} onChange={e => update('ap_ssid', e.target.value)} />
                                </div>
                                <div className="mb-2">
                                    <CFormLabel>Contraseña AP</CFormLabel>
                                    <CFormInput type="password" placeholder="*****" value={wifi.ap_password} onChange={e => update('ap_password', e.target.value)} />
                                </div>

                                <div className="mb-3">
                                    <button type="button" className="btn btn-link p-0 text-primary d-flex align-items-center" onClick={() => setShowAdvancedAP(v => !v)}>
                                        <CIcon icon={cilSettings} className="me-1" /> Opciones Avanzadas AP
                                    </button>
                                    <CCollapse visible={showAdvancedAP}>
                                        <div className="mt-2 ps-2 border-start">
                                            <div className="mb-2">
                                                <CFormLabel>Visibilidad</CFormLabel>
                                                <CFormCheck type="switch" label={apVisibility} checked={wifi.ap_visibility} onChange={e => update('ap_visibility', e.target.checked)} />
                                            </div>
                                            <div className="mb-2">
                                                <CFormLabel>Canal AP (1-13)</CFormLabel>
                                                <CFormInput type="number" min={1} max={13} value={wifi.ap_chanel} onChange={e => update('ap_chanel', parseInt(e.target.value))} />
                                            </div>
                                            <div className="mb-2">
                                                <CFormLabel>Conexiones (0-8)</CFormLabel>
                                                <CFormInput type="number" min={0} max={8} value={wifi.ap_connect} onChange={e => update('ap_connect', parseInt(e.target.value))} />
                                            </div>
                                        </div>
                                    </CCollapse>
                                </div>

                                <CButton type="submit" color="success" className="d-flex align-items-center">
                                    <CIcon icon={cilSave} className="me-1" /> Guardar
                                </CButton>
                            </CForm>
                        </CCardBody>
                    </CCard>
                </div>

                {/* WiFi Scan */}
                <div className="col-md-8">
                    <CCard>
                        <CCardHeader className="bg-success text-white d-flex justify-content-between align-items-center fw-semibold">
                            <span>Redes disponibles</span>
                            <CBadge color="light" textColor="success">{count} Redes</CBadge>
                        </CCardHeader>
                        <CCardBody>
                            {find === 0 ? (
                                <div className="text-center py-4">
                                    <CIcon icon={cilWifiSignal4} className="text-success" style={{ height: 80, width: 80 }} />
                                    <h5 className="text-success text-uppercase mt-3 mb-4">{scanning}</h5>
                                    {scan ? (
                                        <CButton color="success" disabled>
                                            <CSpinner size="sm" className="me-2" /> Escaneando...
                                        </CButton>
                                    ) : (
                                        <CButton color="success" onClick={getWifiScan} className="d-inline-flex align-items-center">
                                            <CIcon icon={cilSearch} className="me-1" /> Escanear
                                        </CButton>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <CTable borderless hover responsive>
                                        <CTableHead>
                                            <CTableRow>
                                                <CTableHeaderCell>SSID | Canal</CTableHeaderCell>
                                                <CTableHeaderCell>Señal (dBm)</CTableHeaderCell>
                                                <CTableHeaderCell className="d-none d-sm-table-cell">BSSID</CTableHeaderCell>
                                                <CTableHeaderCell className="d-none d-sm-table-cell">Seguridad</CTableHeaderCell>
                                                <CTableHeaderCell>Acción</CTableHeaderCell>
                                            </CTableRow>
                                        </CTableHead>
                                        <CTableBody>
                                            {networks.data?.map(({ n, ssid, channel, rssi, bssid, secure }) => (
                                                <CTableRow key={n}>
                                                    <CTableDataCell>{ssid} | {channel}</CTableDataCell>
                                                    <CTableDataCell><em className="text-muted">{rssi}</em></CTableDataCell>
                                                    <CTableDataCell className="d-none d-sm-table-cell">{bssid}</CTableDataCell>
                                                    <CTableDataCell className="d-none d-sm-table-cell">
                                                        <CIcon icon={secure !== 'Open' ? cilLockLocked : cilWifiSignal4} className="me-1" /> {secure}
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                        <CButton size="sm" color="success" onClick={() => selectWiFi(ssid)}>
                                                            <CIcon icon={cilCheck} />
                                                        </CButton>
                                                    </CTableDataCell>
                                                </CTableRow>
                                            ))}
                                        </CTableBody>
                                    </CTable>
                                    {!scan && (
                                        <CButton color="success" onClick={getWifiScan} className="mt-2 d-inline-flex align-items-center">
                                            <CIcon icon={cilSearch} className="me-1" /> Volver a escanear
                                        </CButton>
                                    )}
                                </>
                            )}
                        </CCardBody>
                    </CCard>
                </div>
            </div>
        </CContainer>
    )
}

export default WiFi
