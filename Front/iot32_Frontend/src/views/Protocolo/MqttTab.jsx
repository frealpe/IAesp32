import React, { useState } from 'react'
import { CForm, CButton, CRow, CCol, CFormTextarea } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilSend } from '@coreui/icons'
import withCard from '../../hoc/withCard'
import FormField from '../../components/UI/FormField'
import SwitchField from '../../components/UI/SwitchField'
import ToggleButton from '../../components/UI/ToggleButton'
import { publishMqttMessage } from '../../service/cloudService'
import useApp from '../../hook/useApp'

const MqttConnection = ({ data, cloudEnable, updateConn, handleSubmit }) => {
    const enabled = data.connection?.mqtt_cloud_enable || false
    return (
        <CForm onSubmit={e => { e.preventDefault(); handleSubmit('connection') }}>
            <ToggleButton
                label="Protocolo MQTT"
                value={enabled}
                onChange={val => updateConn('mqtt_cloud_enable', val)}
                labelOn="Habilitado"
                labelOff="Deshabilitado"
            />

            <CRow className="mb-3">
                <CCol md={8}>
                    <FormField
                        label="Servidor MQTT (Broker)"
                        placeholder="mqttserver.com"
                        value={data.connection?.mqtt_server || ''}
                        onChange={e => updateConn('mqtt_server', e.target.value)}
                        className="mb-0"
                    />
                </CCol>
                <CCol md={4}>
                    <FormField
                        label="Puerto"
                        type="number"
                        placeholder="1883"
                        value={data.connection?.mqtt_port || 0}
                        onChange={e => updateConn('mqtt_port', parseInt(e.target.value))}
                        className="mb-0"
                    />
                </CCol>
            </CRow>
            <ToggleButton
                label="Mensajes retenidos"
                value={data.connection?.mqtt_retain || false}
                onChange={val => updateConn('mqtt_retain', val)}
                labelOn="Sí"
                labelOff="No"
            />
            <CRow className="mb-3">
                <CCol md={6}>
                    <FormField
                        label="Calidad del Servicio (QoS)"
                        type="select"
                        value={data.connection?.mqtt_qos || 0}
                        onChange={e => updateConn('mqtt_qos', parseInt(e.target.value))}
                        options={[
                            { value: 0, label: 'QoS 0' },
                            { value: 1, label: 'QoS 1' },
                            { value: 2, label: 'QoS 2' }
                        ]}
                        className="mb-0"
                    />
                </CCol>
                <CCol md={6}>
                    <FormField
                        label="Cliente ID MQTT"
                        placeholder="9B1C5210CE0C3D"
                        value={data.connection?.mqtt_cloud_id || ''}
                        onChange={e => updateConn('mqtt_cloud_id', e.target.value)}
                        className="mb-0"
                    />
                </CCol>
            </CRow>
            <CRow className="mb-3">
                <CCol md={6}>
                    <FormField
                        label="Usuario"
                        placeholder="MQTT_User"
                        value={data.connection?.mqtt_user || ''}
                        onChange={e => updateConn('mqtt_user', e.target.value)}
                        className="mb-0"
                    />
                </CCol>
                <CCol md={6}>
                    <FormField
                        label="Contraseña"
                        type="password"
                        placeholder="*****"
                        value={data.connection?.mqtt_password || ''}
                        onChange={e => updateConn('mqtt_password', e.target.value)}
                        className="mb-0"
                    />
                </CCol>
            </CRow>
            <CRow className="mb-3">
                <CCol md={6}>
                    <FormField
                        label="Tópico Publicación (Upload)"
                        placeholder="cat1/acb/up"
                        value={data.connection?.mqtt_topic_publish || ''}
                        onChange={e => updateConn('mqtt_topic_publish', e.target.value)}
                        className="mb-0"
                    />
                </CCol>
                <CCol md={6}>
                    <FormField
                        label="Tópico Suscripción (Download)"
                        placeholder="cat1/acb/down/imei"
                        value={data.connection?.mqtt_topic_subscribe || ''}
                        onChange={e => updateConn('mqtt_topic_subscribe', e.target.value)}
                        className="mb-0"
                    />
                </CCol>
            </CRow>
            <CButton type="submit" color="success" className="d-flex align-items-center">
                <CIcon icon={cilSave} className="me-1" /> Guardar Conexión MQTT
            </CButton>
        </CForm>
    )
}

const MqttData = ({ data, updateDatos, handleSubmit }) => {
    const { ToastMsgSuccess, ToastMsgError } = useApp()
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)

    const topicPublish = data.connection?.mqtt_topic_publish || 'cat1/acb/up'
    const topicSubscribe = data.connection?.mqtt_topic_subscribe || 'cat1/acb/down/imei'

    // Checkboxes: cuáles tópicos están seleccionados
    const [selectedTopics, setSelectedTopics] = useState({ publish: true, subscribe: false })

    const toggleTopic = (key) =>
        setSelectedTopics(prev => ({ ...prev, [key]: !prev[key] }))

    const handleSend = async (e) => {
        e.preventDefault()
        const targets = [
            selectedTopics.publish && topicPublish,
            selectedTopics.subscribe && topicSubscribe,
        ].filter(Boolean)

        if (targets.length === 0) return ToastMsgError('Selecciona al menos un tópico destino')
        if (!message.trim()) return ToastMsgError('Escribe un mensaje antes de enviar')

        setSending(true)
        let allOk = true
        for (const t of targets) {
            try {
                const res = await publishMqttMessage(t, message.trim())
                if (res.ok) {
                    ToastMsgSuccess(`Enviado a "${t}"`, 2000)
                } else {
                    ToastMsgError(`Error en "${t}": ${res.error}`, 5000)
                    allOk = false
                }
            } catch (err) {
                ToastMsgError(`Error de conexión: ${err}`, 5000)
                allOk = false
            }
        }
        if (allOk) setMessage('')
        setSending(false)
    }

    return (
        <>
            <CForm onSubmit={e => { e.preventDefault(); handleSubmit('data') }}>
                <p className="text-muted mb-3">Parámetros de envío de Data mediante MQTT.</p>
                <ToggleButton
                    label="Enviar datos por MQTT"
                    value={data.datos?.mqtt_time_send || false}
                    onChange={val => updateDatos('mqtt_time_send', val)}
                    labelOn="Sí"
                    labelOff="No"
                />
                <CRow className="mb-3">
                    <CCol md={8}>
                        <FormField
                            label="Intervalo de envío"
                            type="number"
                            placeholder="30"
                            value={data.datos?.mqtt_time_interval || 0}
                            onChange={e => updateDatos('mqtt_time_interval', parseInt(e.target.value))}
                            className="mb-0"
                        />
                    </CCol>
                    <CCol md={4}>
                        <FormField
                            label="Unidad"
                            type="select"
                            value={data.datos?.mqtt_time_unit || 1}
                            onChange={e => updateDatos('mqtt_time_unit', parseInt(e.target.value))}
                            options={[
                                { value: 1, label: 'Segundos' },
                                { value: 60, label: 'Minutos' },
                                { value: 3600, label: 'Horas' }
                            ]}
                            className="mb-0"
                        />
                    </CCol>
                </CRow>
                <ToggleButton
                    label="Enviar estados"
                    value={data.datos?.mqtt_status_send || false}
                    onChange={val => updateDatos('mqtt_status_send', val)}
                    labelOn="Sí"
                    labelOff="No"
                />
                <div className="mb-3">
                    <label className="form-label fw-semibold">Mensaje repetitivo JSON (Opcional)</label>
                    <CFormTextarea
                        rows={3}
                        placeholder='{"temperature": 25.5, "status": "ok"}'
                        value={data.datos?.mqtt_custom_message || ''}
                        onChange={e => updateDatos('mqtt_custom_message', e.target.value)}
                    />
                    <small className="text-muted">Si lo dejas en blanco, se enviarán los datos del sistema por defecto.</small>
                </div>
                <CButton type="submit" color="success" className="d-flex align-items-center mb-4">
                    <CIcon icon={cilSave} className="me-1" /> Guardar Datos MQTT
                </CButton>
            </CForm>

            <hr />
            <p className="fw-semibold mb-2">Publicar mensaje MQTT</p>
            <CForm onSubmit={handleSend}>
                {/* Selector de tópicos destino */}
                <div className="mb-3">
                    <label className="form-label fw-semibold">Tópico destino</label>
                    <div className="d-flex flex-column gap-2 p-2 border rounded bg-light">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="topic-publish"
                                checked={selectedTopics.publish}
                                onChange={() => toggleTopic('publish')}
                            />
                            <label className="form-check-label" htmlFor="topic-publish">
                                <span className="badge bg-success me-2">ESP32 → Broker</span>
                                <code>{topicPublish}</code>
                            </label>
                        </div>
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="topic-subscribe"
                                checked={selectedTopics.subscribe}
                                onChange={() => toggleTopic('subscribe')}
                            />
                            <label className="form-check-label" htmlFor="topic-subscribe">
                                <span className="badge bg-warning text-dark me-2">Broker → ESP32</span>
                                <code>{topicSubscribe}</code>
                            </label>
                        </div>
                    </div>
                    <small className="text-muted">Selecciona uno o ambos tópicos para publicar.</small>
                </div>

                <div className="mb-3">
                    <label className="form-label fw-semibold">Mensaje</label>
                    <CFormTextarea
                        rows={3}
                        placeholder='{"cmd": "reboot"}'
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                </div>
                <CButton type="submit" color="primary" className="d-flex align-items-center" disabled={sending}>
                    <CIcon icon={cilSend} className="me-1" />
                    {sending ? 'Enviando...' : `Publicar${selectedTopics.publish && selectedTopics.subscribe ? ' (ambos)' : ''}`}
                </CButton>
            </CForm>
        </>
    )
}

const MqttConnectionCard = withCard(MqttConnection, { title: 'Conectividad MQTT', color: 'primary' })
const MqttDataCard = withCard(MqttData, { title: 'Datos MQTT', color: 'primary' })

const MqttTab = (props) => (
    <CRow className="g-3">
        <CCol md={6}>
            <MqttConnectionCard {...props} />
        </CCol>
        <CCol md={6}>
            <MqttDataCard {...props} />
        </CCol>
    </CRow>
)

export default MqttTab
