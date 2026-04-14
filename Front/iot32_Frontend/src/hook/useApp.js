import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'

import { 
  deleteSession as deleteSessionService,
  loginSession as loginSessionService 
} from '../service/authService'


export const useApp = () => {

  const navigate = useNavigate()

  const ToastMsg = (msg, time = 5000) => {
    toast(msg, { autoClose: time })
  }
  const ToastMsgError = (msg, time = 5000) => {
    toast.error(msg, { autoClose: time })
  }
  const ToastMsgWarning = (msg, time = 5000) => {
    toast.warning(msg, { autoClose: time })
  }
  const ToastMsgInfo = (msg, time = 5000) => {
    toast.info(msg, { autoClose: time })
  }
  const ToastMsgSuccess = (msg, time = 5000) => {
    toast.success(msg, { autoClose: time })
  }

  const reloadPage = (url, time) => {
    setTimeout(() => {
      window.location.href = `/${url}`
    }, time)
  }

  const login = async (correo, password) => {
    try {
      const resp = await loginSessionService(correo, password)
      if (resp.ok) {
        const data = await resp.json()
        localStorage.setItem('iot32_auth', 'true')
        localStorage.setItem('token', data.token) // Store JWT
        ToastMsgSuccess('Bienvenido')
        navigate('/')
        return true
      } else {
        ToastMsgError('Credenciales incorrectas')
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      ToastMsgError('Error de conexión con el servidor')
      return false
    }
  }

  const deleteSession = () => {
    deleteSessionService()
      .then(() => { 
        localStorage.removeItem('iot32_auth')
        localStorage.removeItem('token')
        window.location.href = '/' 
      })
      .catch(err => {
        console.error('Logout error:', err)
        localStorage.removeItem('iot32_auth')
        localStorage.removeItem('token')
        window.location.href = '/'
      })
  }

  const isAuthenticated = () => {
    return localStorage.getItem('iot32_auth') === 'true' && !!localStorage.getItem('token')
  }



  return {
    ToastMsg,
    ToastMsgError,
    ToastMsgWarning,
    ToastMsgInfo,
    ToastMsgSuccess,
    reloadPage,
    login,
    deleteSession,
    isAuthenticated,
    swal: Swal
  }
}

export default useApp
