import React from 'react'

const PreviewRequest = ({ selectedEndpoint, data, hasToken, token }) => {
    const isAuth = (selectedEndpoint?.value === data.http_connection?.http_auth_path) || (selectedEndpoint?.label?.toLowerCase()?.includes('auth'))
    const isRegisterOrSave = (selectedEndpoint?.value === data.http_connection?.http_register_path || selectedEndpoint?.value === data.http_connection?.http_save_index_path || selectedEndpoint?.value === data.http_connection?.http_save_alarm_path || selectedEndpoint?.value === data.http_connection?.http_save_batch_path)

    const renderBody = () => {
        if (isAuth) {
            return `name=${data.http_connection?.http_user_name}&key=${data.http_connection?.http_password}`
        }
        if (isRegisterOrSave) {
            return JSON.stringify({
                timestamp: "2025-02-03T09:29:55-05:00",
                showErrorDetails: true,
                data: selectedEndpoint?.value === data.http_connection?.http_register_path
                    ? "KZeVPMcDxcdBoWas/upPXkkaPIrJpZA57BsulSKHxNIz53HnKZvkl5XWgU1bKiu+"
                    : selectedEndpoint?.value === data.http_connection?.http_save_index_path
                        ? "KZeVPMcDxcdBoWas/upPXkkaPIrJpZA57BsulSKHxNJhz4D9K9zc5JrvkGzQPtC4ApjAVFkNSNBsgAcX6ZC0qRx2CavgtR28oncrQ0Ve4lYD35oGZv5mySRQEkX8UxYj"
                        : "eyJkZXZpY2Vfc2VyaWFsIjoiSU9UVFMxQTRFNzZBMEE4NjkiLCJkZXZpY2VfbWFudWZhY3R1cmVyIjoiSU9UVFMiLCJkZXZpY2VfZndfdmVyc2lvbiI6IjEuMC4wIn0=",
            }, null, 2)
        }
        if (selectedEndpoint?.method === 'GET') return '-- Sin cuerpo (GET) --'
        return JSON.stringify({
            device_serial: data.meta?.serial || '...',
            device_manufacturer: "IOTTS",
            device_fw_version: "1.0.0",
            "...": "..."
        }, null, 2)
    }

    return (
        <div className="mt-3 p-3 bg-dark text-light rounded border small">
            <div className="d-flex justify-content-between mb-2">
                <span className="fw-bold text-info">Previsualización de la Petición</span>
                <span className="badge bg-secondary">{selectedEndpoint?.method || 'POST'}</span>
            </div>
            <div className="mb-2">
                <span className="text-warning">URL:</span> <span className="text-wrap">https://{data.http_connection?.http_server}{data.http_connection?.http_port !== 443 ? `:${data.http_connection?.http_port}` : ''}{data.http_connection?.http_path}{selectedEndpoint?.value || ''}</span>
            </div>
            <div className="mb-2">
                <span className="text-warning">Headers:</span><br />
                &nbsp;&nbsp;Content-Type: {isAuth ? 'application/x-www-form-urlencoded' : 'application/json'}<br />
                {hasToken && <span className="text-break">&nbsp;&nbsp;Authorization: Bearer {token || '<token_actual>'}</span>}
            </div>
            <div>
                <span className="text-warning">Body:</span>
                <pre className="mt-1 mb-0 p-2 bg-black rounded" style={{ fontSize: '11px', color: '#00ff00' }}>{renderBody()}</pre>
            </div>
        </div>
    )
}

export default PreviewRequest
