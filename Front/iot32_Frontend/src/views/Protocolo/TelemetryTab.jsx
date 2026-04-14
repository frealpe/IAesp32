import React from 'react'
import { CForm, CButton, CRow, CCol, CFormSelect, CFormLabel, CFormInput } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilGlobeAlt } from '@coreui/icons'
import withCard from '../../hoc/withCard'
import EndpointSelector from '../../components/Protocolo/EndpointSelector'
import PreviewRequest from '../../components/Protocolo/PreviewRequest'
import CredentialsForm from '../../components/Protocolo/CredentialsForm'

const TelemetryConfig = ({
    data,
    hasToken,
    token,
    meterIndexTest,
    setMeterIndexTest,
    selectedEndpoint,
    setSelectedEndpoint,
    testEndpoint,
    updateHttpConn,
    handleSubmit
}) => {
    // Detect 'Auth' by value or label (safer if option value is empty)
    const isAuthSelected = selectedEndpoint?.value === data.http_connection?.http_auth_path || selectedEndpoint?.label?.toLowerCase().includes('auth')
    const isDisabled = (!selectedEndpoint?.value && !isAuthSelected) || (!isAuthSelected && !hasToken)

    return (
        <div className="row g-3">
            <div className="col-12">
                <div className="bg-light p-3 rounded mb-4 border">
                    <h6 className="fw-bold mb-3"><CIcon icon={cilGlobeAlt} className="me-2" />Pruebas Manuales de Endpoints</h6>
                    <div className="row g-2 align-items-end">
                        <EndpointSelector
                            data={data}
                            hasToken={hasToken}
                            selectedEndpoint={selectedEndpoint}
                            setSelectedEndpoint={setSelectedEndpoint}
                            meterIndexTest={meterIndexTest}
                            setMeterIndexTest={setMeterIndexTest}
                        />
                        <div className={selectedEndpoint?.value === data.http_connection?.http_save_index_path ? "col-md-3 mt-auto" : "col-md-4"}>
                            <CButton
                                color="primary"
                                className="w-100"
                                disabled={isDisabled}
                                onClick={() => testEndpoint(selectedEndpoint?.label, selectedEndpoint?.value, selectedEndpoint?.method)}
                            >
                                Ejecutar Prueba
                            </CButton>
                        </div>
                    </div>

                    {(selectedEndpoint?.value || isAuthSelected) && (
                        <PreviewRequest selectedEndpoint={selectedEndpoint} data={data} hasToken={hasToken} token={token} />
                    )}
                </div>

                <CredentialsForm data={data} updateHttpConn={updateHttpConn} handleSubmit={handleSubmit} />
            </div>
        </div>
    )
}

const actionRenderer = (props) => (
    <CButton color="info" size="sm" variant="outline" onClick={props.testHttp}>
        <CIcon icon={cilGlobeAlt} className="me-1" /> Renovar Token
    </CButton>
)

const TelemetryTab = withCard(TelemetryConfig, {
    title: 'Configuración VIP Telemetría',
    color: 'dark',
    action: actionRenderer
})

export default TelemetryTab
