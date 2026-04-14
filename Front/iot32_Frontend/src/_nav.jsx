import React from 'react'
import CIcon from '@coreui/icons-react'
import {
    cilSpeedometer,
    cilChartLine,
    cilWifiSignal4,
    cilEthernet,
    cilSettings,
    cilReload,
    cilAccountLogout,
    cilBolt
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
    {
        component: CNavItem,
        name: 'Inicio',
        to: '/',
        icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon me-2" />,
    },
    {
        component: CNavTitle,
        name: 'Configuraciones',
    },
    {
        component: CNavItem,
        name: 'WiFi',
        to: '/wifi',
        icon: <CIcon icon={cilWifiSignal4} customClassName="nav-icon me-2" />,
    },
    {
        component: CNavItem,
        name: 'Protocolo',
        to: '/protocolo',
        icon: <CIcon icon={cilEthernet} customClassName="nav-icon me-2" />,
    },
    {
        component: CNavItem,
        name: 'Configurar',
        to: '/settings',
        icon: <CIcon icon={cilSettings} customClassName="nav-icon me-2" />,
    },
    {
        component: CNavTitle,
        name: 'Control',
    },
    {
        component: CNavItem,
        name: 'Motor Control',
        to: '/motor-control',
        icon: <CIcon icon={cilBolt} customClassName="nav-icon me-2" />,
    },
    {
        component: CNavTitle,
        name: 'Acciones',
    },
    {
        component: CNavItem,
        name: 'Reiniciar',
        action: 'restart',
        icon: <CIcon icon={cilReload} customClassName="nav-icon me-2" />,
    },
    {
        component: CNavItem,
        name: 'Salir',
        action: 'logout',
        icon: <CIcon icon={cilAccountLogout} customClassName="nav-icon me-2" />,
    }
]

export default _nav
