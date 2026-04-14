import React from 'react'
import { CForm, CButton, CRow, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave } from '@coreui/icons'
import withCard from '../../hoc/withCard'
import FormField from '../../components/UI/FormField'
import SwitchField from '../../components/UI/SwitchField'
import ToggleButton from '../../components/UI/ToggleButton'

const HttpConnection = ({ data, httpCloudEnable, updateHttpConn, handleSubmit }) => {
    const enabled = data.http_connection?.http_cloud_enable || false
    return (
        <CForm onSubmit={e => { e.preventDefault(); handleSubmit('http_connection') }}>
            <ToggleButton
                label="Protocolo HTTP"
                value={enabled}
                onChange={val => updateHttpConn('http_cloud_enable', val)}
                labelOn="Habilitado"
                labelOff="Deshabilitado"
            />
            <FormField
                label="Servidor / Endpoint (Host)"
                placeholder="wsp.acueducto.com.co"
                value={data.http_connection?.http_server || ''}
                onChange={e => updateHttpConn('http_server', e.target.value)}
            />
            <CRow className="mb-4">
                <CCol md={4}>
                    <FormField
                        label="Puerto"
                        type="number"
                        placeholder="443"
                        value={data.http_connection?.http_port || 80}
                        onChange={e => updateHttpConn('http_port', parseInt(e.target.value))}
                        className="mb-0"
                    />
                </CCol>
                <CCol md={8}>
                    <FormField
                        label="Ruta Base (Prefix)"
                        placeholder="/miatelemetryapitest"
                        value={data.http_connection?.http_path || ''}
                        onChange={e => updateHttpConn('http_path', e.target.value)}
                        className="mb-0"
                    />
                </CCol>
            </CRow>
            <CButton type="submit" color="success" className="d-flex align-items-center">
                <CIcon icon={cilSave} className="me-1" /> Guardar Conexión HTTP
            </CButton>
        </CForm>
    )
}

const HttpData = ({ data, updateHttpDatos, handleSubmit }) => (
    <CForm onSubmit={e => { e.preventDefault(); handleSubmit('http_data') }}>
        <p className="text-muted mb-4">Parámetros de envío de Data mediante HTTP Post/Get.</p>
        <ToggleButton
            label="Enviar datos por HTTP"
            value={data.http_datos?.http_time_send || false}
            onChange={val => updateHttpDatos('http_time_send', val)}
            labelOn="Sí"
            labelOff="No"
        />
        <CRow className="mb-3">
            <CCol md={8}>
                <FormField
                    label="Intervalo de envío"
                    type="number"
                    placeholder="60"
                    value={data.http_datos?.http_time_interval || 0}
                    onChange={e => updateHttpDatos('http_time_interval', parseInt(e.target.value))}
                    className="mb-0"
                />
            </CCol>
            <CCol md={4}>
                <FormField
                    label="Unidad"
                    type="select"
                    value={data.http_datos?.http_time_unit || 1}
                    onChange={e => updateHttpDatos('http_time_unit', parseInt(e.target.value))}
                    options={[
                        { value: 1, label: 'Segundos' },
                        { value: 60, label: 'Minutos' },
                        { value: 3600, label: 'Horas' }
                    ]}
                    className="mb-0"
                />
            </CCol>
        </CRow>
        <ToggleButton
            label="Enviar estados vía HTTP"
            value={data.http_datos?.http_status_send || false}
            onChange={val => updateHttpDatos('http_status_send', val)}
            labelOn="Sí"
            labelOff="No"
        />
        <FormField
            label="AES Key (Base64)"
            placeholder="snHZjFmUkvD4BfmvdsyPcb3TptXWQvvpGWGSasv3Y3g="
            value={data.http_datos?.http_encrypt_key || ''}
            onChange={e => updateHttpDatos('http_encrypt_key', e.target.value)}
        />
        <FormField
            label="AES IV (Base64)"
            placeholder="sAxi0e7BvpE9oR6WdfOlew=="
            value={data.http_datos?.http_encrypt_iv || ''}
            onChange={e => updateHttpDatos('http_encrypt_iv', e.target.value)}
        />
        <CButton type="submit" color="success" className="d-flex align-items-center">
            <CIcon icon={cilSave} className="me-1" /> Guardar Datos HTTP
        </CButton>
    </CForm>
)

const HttpConnectionCard = withCard(HttpConnection, { title: 'Conectividad HTTP', color: 'info' })
const HttpDataCard = withCard(HttpData, { title: 'Datos HTTP', color: 'info' })

const HttpTab = (props) => (
    <CRow className="g-3">
        <CCol md={6}>
            <HttpConnectionCard {...props} />
        </CCol>
        <CCol md={6}>
            <HttpDataCard {...props} />
        </CCol>
    </CRow>
)

export default HttpTab
