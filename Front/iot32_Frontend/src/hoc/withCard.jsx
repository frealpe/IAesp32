import React from 'react'
import { CCard, CCardHeader, CCardBody } from '@coreui/react'

const withCard = (WrappedComponent, { title, color = 'primary', textColor = 'white', action = null }) => {
    const WithCard = (props) => (
        <CCard className="shadow-sm border-0 h-100">
            <CCardHeader className={`bg-${color} text-${textColor} fw-semibold d-flex justify-content-between align-items-center`}>
                <span>{title}</span>
                {action && <div>{action(props)}</div>}
            </CCardHeader>
            <CCardBody>
                <WrappedComponent {...props} />
            </CCardBody>
        </CCard>
    )

    WithCard.displayName = `WithCard(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
    return WithCard
}

export default withCard
