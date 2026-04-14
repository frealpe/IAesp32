import React from 'react'

const Index = React.lazy(() => import('./views/Index'))
const WiFi = React.lazy(() => import('./views/WiFi'))
const Protocolo = React.lazy(() => import('./views/Protocolo'))
const Settings = React.lazy(() => import('./views/Settings'))
const Page404 = React.lazy(() => import('./views/Page404'))

const routes = [
    {
        path: '/',
        name: 'Index',
        element: Index,
        exact: true,
    },
    {
        path: '/wifi',
        name: 'WiFi',
        element: WiFi,
        exact: true,
    },
    {
        path: '/protocolo',
        name: 'Protocolo',
        element: Protocolo,
        exact: true,
    },
    {
        path: '/settings',
        name: 'Settings',
        element: Settings,
        exact: true,
    },
    {
        path: '*',
        name: 'Page404',
        element: Page404,
    }
]

export default routes
