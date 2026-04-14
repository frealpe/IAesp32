import React from 'react'
import { CFormSelect, CFormLabel, CFormInput } from '@coreui/react'

const EndpointSelector = ({ data, hasToken, selectedEndpoint, setSelectedEndpoint, meterIndexTest, setMeterIndexTest }) => {
    return (
        <>
            <div className="col-md-8">
                <CFormLabel className="small">Seleccionar Endpoint para probar</CFormLabel>
                <CFormSelect
                    id="endpointSelector"
                    onChange={(e) => {
                        const opt = e.target.options[e.target.selectedIndex];
                        setSelectedEndpoint({
                            label: opt.text,
                            value: e.target.value,
                            method: opt.getAttribute('data-method')
                        });
                    }}
                >
                    <option value="">-- Seleccione un endpoint --</option>
                    <option value={data.http_connection?.http_auth_path} data-method="POST">Auth (POST)</option>
                    <option value={data.http_connection?.http_register_path} data-method="POST" disabled={!hasToken}>Register Meter (POST)</option>
                    <option value={data.http_connection?.http_save_index_path} data-method="POST" disabled={!hasToken}>Save Index (POST)</option>
                    <option value={data.http_connection?.http_save_alarm_path} data-method="POST" disabled={!hasToken}>Save Alarm (POST)</option>
                    <option value={data.http_connection?.http_save_batch_path} data-method="POST" disabled={!hasToken}>Save Batch (POST)</option>
                    <option value={data.http_connection?.http_encrypt_test_path} data-method="POST" disabled={!hasToken}>Encrypt Test (POST)</option>
                    <option value={data.http_connection?.http_get_index_path} data-method="GET" disabled={!hasToken}>Get Indexs (GET)</option>
                    <option value={data.http_connection?.http_get_meters_path} data-method="GET" disabled={!hasToken}>Get Meters (GET)</option>
                </CFormSelect>
            </div>
            {selectedEndpoint?.value === data.http_connection?.http_save_index_path && (
                <div className="col-md-3">
                    <CFormLabel>Meter Index</CFormLabel>
                    <CFormInput
                        type="number"
                        placeholder="80"
                        value={meterIndexTest}
                        onChange={e => setMeterIndexTest(e.target.value)}
                        title="Valor numérico para meterIndex"
                    />
                </div>
            )}
        </>
    )
}

export default EndpointSelector
