import React, { useState } from 'react'
import {
    CButton,
    CCard,
    CCardBody,
    CCol,
    CContainer,
    CForm,
    CFormInput,
    CInputGroup,
    CInputGroupText,
    CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilLockLocked } from '@coreui/icons'
import logo from '../assets/Logo.jpeg'
import acueducto from '../assets/acueducto.jpeg'
import useApp from '../hook/useApp'

const Login = () => {
    const [correo, setCorreo] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useApp()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        await login(correo, password)
        setLoading(false)
    }

    return (
        <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
            <CContainer>
                <CRow className="justify-content-center align-items-center">
                    <CCol md={9} lg={8} className="d-flex flex-column flex-md-row align-items-center bg-white p-4 p-md-5 shadow-lg rounded-4 overflow-hidden">
                        {/* Form Section */}
                        <div className="flex-grow-1 w-100 pe-md-4">
                            <div className="text-center text-md-start mb-4">
                                <img src={logo} alt="Logo" height={50} className="mb-3 rounded" />
                                <h2 className="fw-bold text-dark">Iniciar Sesión</h2>
                                <p className="text-medium-emphasis">Accede al panel de control IOT32</p>
                            </div>
                            <CForm onSubmit={handleLogin}>
                                <CInputGroup className="mb-3">
                                    <CInputGroupText className="bg-light border-0">
                                        <CIcon icon={cilUser} className="text-primary" />
                                    </CInputGroupText>
                                    <CFormInput
                                        placeholder="Usuario / MAC"
                                        autoComplete="username"
                                        type="text"
                                        className="bg-light border-0 py-2"
                                        value={correo}
                                        onChange={(e) => setCorreo(e.target.value)}
                                        required
                                    />
                                </CInputGroup>
                                <CInputGroup className="mb-4">
                                    <CInputGroupText className="bg-light border-0">
                                        <CIcon icon={cilLockLocked} className="text-primary" />
                                    </CInputGroupText>
                                    <CFormInput
                                        type="password"
                                        placeholder="Contraseña"
                                        autoComplete="current-password"
                                        className="bg-light border-0 py-2"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </CInputGroup>
                                <CButton
                                    color="primary"
                                    className="px-4 w-100 py-2 fw-bold shadow-sm"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'CARGANDO...' : 'ENTRAR'}
                                </CButton>
                            </CForm>
                        </div>

                        {/* Circular Image Section - Side by Side */}
                        <div className="d-flex justify-content-center align-items-center mt-4 mt-md-0 ps-md-4 border-md-start">
                            <div
                                className="rounded-circle shadow-lg border border-4 border-white overflow-hidden"
                                style={{
                                    width: '200px',
                                    height: '200px',
                                    minWidth: '200px'
                                }}
                            >
                                <img
                                    src={acueducto}
                                    alt="Aqueduct"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                        </div>
                    </CCol>
                </CRow>
            </CContainer>
        </div>
    )
}

export default Login
