import React from 'react'
import { CForm, CButton, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave } from '@coreui/icons'
import FormField from '../UI/FormField'

const CredentialsForm = ({ data, updateHttpConn, handleSubmit }) => {
    return (
        <CForm onSubmit={e => { e.preventDefault(); handleSubmit('http_connection') }}>
            <div className="row mb-3">
                <CCol md={6}>
                    <FormField
                        label="Name (Usuario API)"
                        placeholder="cofemetrex"
                        value={data.http_connection?.http_user_name || ''}
                        onChange={e => updateHttpConn('http_user_name', e.target.value)}
                    />
                </CCol>
                <CCol md={6}>
                    <FormField
                        label="Key (API Key / Password)"
                        type="password"
                        placeholder="*****"
                        value={data.http_connection?.http_password || ''}
                        onChange={e => updateHttpConn('http_password', e.target.value)}
                    />
                </CCol>
            </div>
            <CButton type="submit" color="success" className="d-flex align-items-center">
                <CIcon icon={cilSave} className="me-1" /> Guardar Credenciales API
            </CButton>
        </CForm>
    )
}

export default CredentialsForm
