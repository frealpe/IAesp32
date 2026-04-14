import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => (
    <CFooter className="px-4">
        <div>
            <a href="https://iottsolutions.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                Iot@solution
            </a>
            <span className="ms-1">&copy; {new Date().getFullYear()}</span>
        </div>
        <div className="ms-auto">
            <span>Powered by </span>
            <a href="https://iottsolutions.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                Iot Tech Solutions
            </a>
        </div>
    </CFooter>
)

export default AppFooter
