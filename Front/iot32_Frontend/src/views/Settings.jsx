import React, { useState } from 'react'
import {
    CContainer, CCard, CCardBody, CCardHeader, CRow, CCol,
    CForm, CFormLabel, CFormInput, CButton, CNav, CNavItem, CNavLink,
    CTabContent, CTabPane
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilSettings, cilTerminal, cilSave, cilTrash, cilCloudUpload, cilCloudDownload, cilActionUndo } from '@coreui/icons'
import useSettings from '../hook/useSettings'

const Settings = () => {
    const [activeTab, setActiveTab] = useState(0)
    const {
        device, setDevice, user, setUser,
        handleSubmit, clearUser, downloadSettings, uploadSettings,
        uploadFirmware, loading, progress, percent, showAlertConfirm
    } = useSettings()

    const updateDevice = (f, v) => setDevice(p => ({ ...p, [f]: v }))
    const updateUser = (f, v) => setUser(p => ({ ...p, [f]: v }))

    return (
        <CContainer fluid className="px-4">
            <h4 className="mb-4">Configuración General</h4>
            <CRow className="g-3">
                {/* Tabs Block */}
                <CCol md={7}>
                    <CCard>
                        <CCardHeader className="bg-primary text-white fw-semibold">Configuración del Dispositivo</CCardHeader>
                        <CCardBody>
                            <CNav variant="tabs" role="tablist">
                                <CNavItem>
                                    <CNavLink active={activeTab === 0} onClick={() => setActiveTab(0)} style={{ cursor: 'pointer' }} className="d-flex align-items-center">
                                        <CIcon icon={cilUser} className="me-1 opacity-50" /> Usuario
                                    </CNavLink>
                                </CNavItem>
                                <CNavItem>
                                    <CNavLink active={activeTab === 1} onClick={() => setActiveTab(1)} style={{ cursor: 'pointer' }} className="d-flex align-items-center">
                                        <CIcon icon={cilSettings} className="me-1 opacity-50" /> Dispositivo
                                    </CNavLink>
                                </CNavItem>
                                <CNavItem>
                                    <CNavLink active={activeTab === 2} onClick={() => setActiveTab(2)} style={{ cursor: 'pointer' }} className="d-flex align-items-center">
                                        <CIcon icon={cilTerminal} className="me-1 opacity-50" /> Firmware
                                    </CNavLink>
                                </CNavItem>
                            </CNav>

                            <CTabContent className="mt-3">
                                {/* Tab: Usuario */}
                                <CTabPane visible={activeTab === 0}>
                                    <h5 className="fw-semibold mb-3">Usuario y Contraseña</h5>
                                    <CForm onSubmit={e => { e.preventDefault(); handleSubmit('user') }}>
                                        {[
                                            { id: 'device_old_user', label: 'Usuario Anterior', type: 'text' },
                                            { id: 'device_old_password', label: 'Contraseña Anterior', type: 'password' },
                                            { id: 'device_new_user', label: 'Nuevo Usuario', type: 'text' },
                                            { id: 'device_new_password', label: 'Nueva Contraseña', type: 'password' },
                                            { id: 'device_c_new_password', label: 'Confirmar nueva Contraseña', type: 'password' },
                                        ].map(({ id, label, type }) => (
                                            <div className="mb-3" key={id}>
                                                <CFormLabel>{label}</CFormLabel>
                                                <CFormInput type={type} placeholder={label} value={user[id] || ''} onChange={e => updateUser(id, e.target.value)} />
                                            </div>
                                        ))}
                                        <div className="d-flex gap-2">
                                            <CButton type="submit" color="success" className="d-flex align-items-center"><CIcon icon={cilSave} className="me-1" /> Guardar</CButton>
                                            <CButton type="button" color="info" onClick={clearUser} className="d-flex align-items-center text-white"><CIcon icon={cilTrash} className="me-1" /> Limpiar</CButton>
                                        </div>
                                    </CForm>
                                </CTabPane>

                                {/* Tab: Dispositivo */}
                                <CTabPane visible={activeTab === 1}>
                                    <h5 className="fw-semibold mb-3">Dispositivo</h5>
                                    <CForm onSubmit={e => { e.preventDefault(); handleSubmit('device') }}>
                                        <div className="mb-3">
                                            <CFormLabel>Número de Serie</CFormLabel>
                                            <CFormInput readOnly value={device.device_serial || ''} />
                                        </div>
                                        <div className="mb-4">
                                            <CFormLabel>Identificación del Dispositivo</CFormLabel>
                                            <CFormInput placeholder="adminiot32" value={device.device_id || ''} onChange={e => updateDevice('device_id', e.target.value)} />
                                        </div>
                                        <CButton type="submit" color="success" className="d-flex align-items-center"><CIcon icon={cilSave} className="me-1" /> Guardar</CButton>
                                        <p className="mt-3 text-muted">
                                            El identificador se usa para el mDNS Url.<br />
                                            <strong>Ejemplo:</strong> <code>http://{device.device_id || 'device'}.local</code>
                                        </p>
                                    </CForm>
                                </CTabPane>

                                {/* Tab: Firmware */}
                                <CTabPane visible={activeTab === 2}>
                                    <h5 className="fw-semibold mb-3">Firmware y FileSystem</h5>
                                    <p className="text-muted">Use este Botón para actualizar el Firmware o el FileSystem del Dispositivo.</p>
                                    <div className="input-group mb-3">
                                        <label className="input-group-text"><CIcon icon={cilCloudUpload} /></label>
                                        <input type="file" accept="application/octet-stream" className="form-control" id="inputFileFirmware" />
                                        <CButton color="primary" onClick={uploadFirmware}>Importar</CButton>
                                    </div>
                                    <p className="text-muted">Nota: Si el nombre de archivo incluye <em>spiffs</em>, actualiza la partición del FileSystem.</p>
                                    {loading && (
                                        <div className="mt-3">
                                            <h6>Cargando...</h6>
                                            <div className="progress mt-2">
                                                <div
                                                    className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                                                    style={{ width: percent }}
                                                >
                                                    {progress.msg}%
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CTabPane>
                            </CTabContent>
                        </CCardBody>
                    </CCard>
                </CCol>

                {/* Settings file Block */}
                <CCol md={5}>
                    <CCard>
                        <CCardHeader className="bg-primary text-white fw-semibold">Archivo de configuraciones</CCardHeader>
                        <CCardBody>
                            <h6>Descargar archivo de configuración (<code>settings.json</code>)</h6>
                            <p className="text-muted">Use este <code>Botón</code> para exportar las configuraciones actuales.</p>
                            <CButton color="secondary" onClick={downloadSettings} className="mb-3 d-flex align-items-center">
                                <CIcon icon={cilCloudDownload} className="me-1" /> Exportar
                            </CButton>
                            <hr />
                            <h6>Restablecer configuraciones predeterminada</h6>
                            <p className="text-muted">Use este <code>Botón</code> para restablecer a los parámetros de fábrica.</p>
                            <CButton color="warning" className="mb-3 d-flex align-items-center"
                                onClick={() => showAlertConfirm('Restablecer', '¿Está seguro de volver a las configuraciones de fábrica?', 'question', 'restore')}>
                                <CIcon icon={cilActionUndo} className="me-1" /> Restablecer
                            </CButton>
                            <hr />
                            <h6>Subir el archivo de configuración (<code>settings.json</code>)</h6>
                            <div className="input-group">
                                <label className="input-group-text"><CIcon icon={cilCloudUpload} /></label>
                                <input type="file" accept="application/json" className="form-control" id="inputFileAdd" />
                                <CButton color="primary" onClick={uploadSettings}>Importar</CButton>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>
        </CContainer>
    )
}

export default Settings
