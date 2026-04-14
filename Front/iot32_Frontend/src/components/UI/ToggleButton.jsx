import React from 'react'
import PropTypes from 'prop-types'

/**
 * ToggleButton — control de dos estados tipo botón segmentado.
 * Muestra dos botones: uno para ON y otro para OFF.
 */
const ToggleButton = ({
    value,
    onChange,
    labelOn = 'Habilitado',
    labelOff = 'Deshabilitado',
    label,
    className = 'mb-3',
}) => (
    <div className={className}>
        {label && <label className="form-label fw-semibold d-block">{label}</label>}
        <div className="btn-group w-100" role="group">
            <button
                type="button"
                className={`btn btn-sm ${value ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => onChange(true)}
            >
                ✓ {labelOn}
            </button>
            <button
                type="button"
                className={`btn btn-sm ${!value ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => onChange(false)}
            >
                ✗ {labelOff}
            </button>
        </div>
    </div>
)

ToggleButton.propTypes = {
    value: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    labelOn: PropTypes.string,
    labelOff: PropTypes.string,
    label: PropTypes.string,
    className: PropTypes.string,
}

export default ToggleButton
