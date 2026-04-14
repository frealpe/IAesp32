// Usamos rutas relativas para que funcione tanto en desarrollo (proxy) como en producción (mismo host)
export const IS_DEV = import.meta.env.DEV
export const API = (path) => path

