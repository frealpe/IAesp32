import React, { useId } from 'react'
import { CFormCheck, CFormLabel } from '@coreui/react'
import PropTypes from 'prop-types'

const SwitchField = ({ label, checked, onChange, className = 'mb-3', switchLabel, id, ...props }) => {
    const autoId = useId()
    const switchId = id || autoId
    return (
        <div className={className}>
            {label && <CFormLabel htmlFor={switchId} className="d-block">{label}</CFormLabel>}
            <CFormCheck
                id={switchId}
                type="switch"
                label={switchLabel || (checked ? 'Habilitado' : 'Deshabilitado')}
                checked={checked}
                onChange={onChange}
                {...props}
            />
        </div>
    )
}

SwitchField.propTypes = {
    id: PropTypes.string,
    label: PropTypes.string,
    switchLabel: PropTypes.string,
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string,
}

export default SwitchField
