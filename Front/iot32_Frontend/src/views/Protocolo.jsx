import React, { useState } from 'react'
import { CContainer, CNav, CNavItem, CNavLink, CTabContent, CTabPane } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloud, cilGlobeAlt } from '@coreui/icons'
import useCloud from '../hook/useCloud'

// Sub-components
import MqttTab from './Protocolo/MqttTab'
import HttpTab from './Protocolo/HttpTab'
import TelemetryTab from './Protocolo/TelemetryTab'

const Protocolo = () => {
    const cloudProps = useCloud()
    const { cloudEnable, httpCloudEnable, testHttp, testEndpoint } = cloudProps
    const [activeTab, setActiveTab] = useState(1)
    const [selectedEndpoint, setSelectedEndpoint] = useState({ label: '', value: '', method: '' })

    return (
        <CContainer fluid className="px-4">
            <h4 className="mb-4">Configuración de Protocolos Cloud</h4>

            <CNav variant="tabs" className="mb-4">
                <CNavItem>
                    <CNavLink active={activeTab === 1} onClick={() => setActiveTab(1)} style={{ cursor: 'pointer' }}>
                        <CIcon icon={cilCloud} className="me-2" />
                        MQTT
                    </CNavLink>
                </CNavItem>
                <CNavItem>
                    <CNavLink active={activeTab === 2} onClick={() => setActiveTab(2)} style={{ cursor: 'pointer' }}>
                        <CIcon icon={cilGlobeAlt} className="me-2" />
                        HTTP
                    </CNavLink>
                </CNavItem>
                <CNavItem>
                    <CNavLink active={activeTab === 3} onClick={() => setActiveTab(3)} style={{ cursor: 'pointer' }}>
                        <CIcon icon={cilGlobeAlt} className="me-2" />
                        Telemetría
                    </CNavLink>
                </CNavItem>
            </CNav>

            <CTabContent>
                {/* TAB MQTT */}
                <CTabPane visible={activeTab === 1}>
                    <MqttTab {...cloudProps} />
                </CTabPane>

                {/* TAB HTTP */}
                <CTabPane visible={activeTab === 2}>
                    <HttpTab {...cloudProps} />
                </CTabPane>

                {/* TAB TELEMETRIA VIP */}
                <CTabPane visible={activeTab === 3}>
                    <TelemetryTab
                        {...cloudProps}
                        selectedEndpoint={selectedEndpoint}
                        setSelectedEndpoint={setSelectedEndpoint}
                    />
                </CTabPane>
            </CTabContent>
        </CContainer>
    )
}

export default Protocolo
