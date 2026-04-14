import React from 'react'
import { CFormLabel, CFormInput, CFormSelect } from '@coreui/react'
import PropTypes from 'prop-types'

const FormField = ({ label, type = 'text', placeholder, value, onChange, options, className = 'mb-3', ...props }) => {
    return (
        <div className={className}>
            {label && <CFormLabel>{label}</CFormLabel>}
            {type === 'select' ? (
                <CFormSelect value={value} onChange={onChange} {...props}>
                    {options.map((opt, idx) => (
                        <option key={idx} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </CFormSelect>
            ) : (
                <CFormInput
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    {...props}
                />
            )}
        </div>
    )
}

FormField.propTypes = {
    label: PropTypes.string,
    type: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    options: PropTypes.array,
    className: PropTypes.string,
}

export default FormField
