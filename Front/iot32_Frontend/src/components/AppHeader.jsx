import React from 'react'
import { NavLink } from 'react-router-dom'
import {
    CHeader, CHeaderToggler, CHeaderNav, CHeaderBrand, CContainer,
    CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CDropdownDivider,
    CModal, CModalHeader, CModalTitle, CModalBody, CRow, CCol, CCard, CCardBody
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMenu, cilList, cilUser, cilChevronBottom, cilSettings, cilAccountLogout, cilMemory } from '@coreui/icons'
import Swal from 'sweetalert2'
import useApp from '../hook/useApp'

import logo from '../assets/Logo.jpeg'

const AppHeader = ({ sidebarShow, setSidebarShow }) => {
    const { deleteSession } = useApp()
    const [pinModal, setPinModal] = React.useState(false);
    const [pinStatus, setPinStatus] = React.useState({});

    React.useEffect(() => {
        let interval;
        if (pinModal) {
            const fetchPins = async () => {
                try {
                    const res = await fetch('/api/status');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.pins) setPinStatus(data.pins);
                    }
                } catch (e) { }
            };
            fetchPins();
            interval = setInterval(fetchPins, 1500);
        }
        return () => clearInterval(interval);
    }, [pinModal]);

    const showAlertConfirm = (title, text, icon, funct) => {
        Swal.fire({
            title, text, icon,
            showCancelButton: true,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed && funct === 'logout') deleteSession()
        })
    }

    return (
        <CHeader position="sticky" className="mb-4 p-0">
            <CContainer fluid className="border-bottom px-4">
                <CHeaderToggler
                    onClick={() => setSidebarShow(v => !v)}
                    className="ps-1"
                    style={{
                        marginInlineStart: '-14px',
                        backgroundColor: !sidebarShow ? 'rgba(50, 31, 219, 0.1)' : 'transparent',
                        borderRadius: '4px',
                        padding: '5px'
                    }}
                >
                    <CIcon icon={sidebarShow ? cilMenu : cilList} size="lg" className="text-primary" />
                </CHeaderToggler>
                <CHeaderBrand className="mx-auto d-md-none d-flex justify-content-center">
                    <img src={logo} alt="Logo" height={30} />
                </CHeaderBrand>
                <CHeaderNav className="ms-auto d-flex align-items-center">
                    <CDropdown variant="nav-item" placement="bottom-end" className="me-3">
                        <CDropdownToggle caret={false} as="div" className="d-flex align-items-center" onClick={() => setPinModal(true)} style={{ cursor: 'pointer' }}>
                            <CIcon icon={cilMemory} size="lg" className="text-primary" />
                        </CDropdownToggle>
                    </CDropdown>
                    <CDropdown variant="nav-item" placement="bottom-end">
                        <CDropdownToggle caret={false} className="d-flex align-items-center">
                            <CIcon icon={cilUser} className="d-sm-none" />
                            <span className="d-none d-sm-inline-block">Usuario</span>
                            <CIcon icon={cilChevronBottom} size="sm" className="ms-1 d-none d-sm-inline-block" />
                        </CDropdownToggle>
                        <CDropdownMenu>
                            <div className="bg-primary rounded-top text-white text-center p-2 fw-semibold">Opciones</div>
                            <CDropdownItem as={NavLink} to="/settings">
                                <CIcon icon={cilSettings} className="me-2" /> Configurar
                            </CDropdownItem>
                            <CDropdownDivider />
                            <CDropdownItem
                                style={{ cursor: 'pointer' }}
                                onClick={() => showAlertConfirm('Sesión', '¿Está seguro de cerrar la sesión?', 'question', 'logout')}
                            >
                                <CIcon icon={cilAccountLogout} className="me-2" /> Salir
                            </CDropdownItem>
                        </CDropdownMenu>
                    </CDropdown>
                </CHeaderNav>
            </CContainer>

            <CModal visible={pinModal} onClose={() => setPinModal(false)} size="lg" alignment="center">
                <CModalHeader>
                    <CModalTitle>
                        <CIcon icon={cilMemory} className="me-2" />
                        Estado de Pines en Tiempo Real
                    </CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <CRow>
                        {Object.keys(pinStatus).map(pin => (
                            <CCol xs="6" sm="4" md="3" key={pin} className="mb-3">
                                <CCard className="text-center shadow-sm">
                                    <CCardBody className="p-3">
                                        <div className="fw-bold fs-5 text-primary">Pin {pin}</div>
                                        <div className="small font-monospace bg-light rounded px-2 py-1 mt-2 text-muted">{pinStatus[pin].mode}</div>
                                        <div className="fw-bold fs-4 mt-2">
                                            {pinStatus[pin].value === true ? "ON" :
                                                pinStatus[pin].value === false ? "OFF" :
                                                    pinStatus[pin].value}
                                        </div>
                                    </CCardBody>
                                </CCard>
                            </CCol>
                        ))}
                        {Object.keys(pinStatus).length === 0 && <p className="text-center text-muted col-12">Recopilando recursos PyCloude...</p>}
                    </CRow>
                </CModalBody>
            </CModal>

        </CHeader>
    )
}

export default AppHeader
