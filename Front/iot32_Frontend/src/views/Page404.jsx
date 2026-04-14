import React from 'react'
import { Link } from 'react-router-dom'
import { CContainer, CButton } from '@coreui/react'

const Page404 = () => (
    <CContainer className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <h1 style={{ fontSize: '6rem', fontWeight: 900, color: '#321fdb' }}>404</h1>
        <h4 className="mb-3">Página no encontrada</h4>
        <p className="text-muted mb-4">La página que buscas no existe o ha sido movida.</p>
        <CButton as={Link} to="/" color="primary">
            <i className="fa fa-home me-2" /> Volver al Inicio
        </CButton>
    </CContainer>
)

export default Page404
