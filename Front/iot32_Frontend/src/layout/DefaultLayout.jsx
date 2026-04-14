import React, { useState } from 'react'
import AppSidebar from '../components/AppSidebar'
import AppHeader from '../components/AppHeader'
import AppFooter from '../components/AppFooter'
import AppContent from '../components/AppContent'
import useApp from '../hook/useApp'
import { Navigate } from 'react-router-dom'

const DefaultLayout = () => {
    const [sidebarShow, setSidebarShow] = useState(true)
    const { isAuthenticated } = useApp()

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />
    }

    return (
        <div className="wrapper d-flex flex-column min-vh-100">
            <AppSidebar sidebarShow={sidebarShow} setSidebarShow={setSidebarShow} />
            <div
                className="wrapper d-flex flex-column min-vh-100 transition-all"
                style={{
                    marginLeft: sidebarShow && window.innerWidth >= 768 ? '256px' : '0',
                    transition: 'margin-left 0.15s'
                }}
            >
                <AppHeader sidebarShow={sidebarShow} setSidebarShow={setSidebarShow} />
                <div className="body flex-grow-1">
                    <AppContent />
                </div>
                <AppFooter />
            </div>
        </div>
    )
}

export default DefaultLayout
