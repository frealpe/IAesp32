import React from 'react'
import { NavLink } from 'react-router-dom'
import { CSidebarNav } from '@coreui/react'

export const AppSidebarNav = ({ items, onActionClick }) => {
    const navItem = (item, index) => {
        const { component, name, icon, to, action, ...rest } = item
        const Component = component

        // Handle Title Components
        if (Component.name === 'CNavTitle' || !to && !action) {
            return <Component key={index} {...rest}>{name}</Component>
        }

        const content = (
            <>
                {icon && <i className={`nav-icon ${icon} me-2`} />}
                {name}
            </>
        )

        if (to) {
            return (
                <Component key={index}>
                    <NavLink
                        to={to}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                        {...rest}
                    >
                        {content}
                    </NavLink>
                </Component>
            )
        }

        if (action) {
            return (
                <Component key={index}>
                    <a
                        className="nav-link"
                        style={{ cursor: 'pointer' }}
                        onClick={() => onActionClick && onActionClick(action)}
                        {...rest}
                    >
                        {content}
                    </a>
                </Component>
            )
        }

        return (
            <Component key={index} {...rest}>
                {content}
            </Component>
        )
    }

    return (
        <CSidebarNav>
            {items && items.map((item, index) => navItem(item, index))}
        </CSidebarNav>
    )
}
