"use client"

import { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import { authService } from "@/services/authService"
import { useToast } from "./ToastContext"

// Estados del contexto
const AuthContext = createContext()

// Tipos de acciones
const AUTH_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_USER: "SET_USER",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  LOGOUT: "LOGOUT",
  INITIALIZE: "INITIALIZE",
}

// Estado inicial
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  initialized: false,
}

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null,
      }

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null,
      }

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      }

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      }

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      }

    case AUTH_ACTIONS.INITIALIZE:
      return {
        ...state,
        initialized: true,
      }

    default:
      return state
  }
}

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const toast = useToast()

  // Inicializar autenticación
  const initialize = useCallback(async () => {
    try {
      const isAuth = authService.isAuthenticated()
      const user = authService.getCurrentUser()

      if (isAuth && user) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user })
      }
    } catch (error) {
      console.error("Error inicializando auth:", error)
      await authService.logout()
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    } finally {
      dispatch({ type: AUTH_ACTIONS.INITIALIZE })
    }
  }, [])

  // Login con mejor manejo de errores
  const login = useCallback(
    async (credentials) => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      try {
        console.log("🔄 Iniciando proceso de login...")
        const result = await authService.login(credentials)

        console.log("📊 Resultado del login:", result)

        if (result.success) {
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: result.data.user })
          toast.success(`¡Bienvenido, ${result.data.user.name}!`, {
            title: "Inicio de sesión exitoso",
          })
          console.log("✅ Login completado exitosamente")
          return { success: true }
        } else {
          const errorMessage = result.error || "Error desconocido en el login"
          console.log("❌ Login fallido:", errorMessage)
          dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
          toast.error(errorMessage, {
            title: "Error de autenticación",
          })
          return { success: false, error: errorMessage }
        }
      } catch (error) {
        console.error("💥 Error inesperado en login:", error)
        const errorMessage = error.message || "Error de conexión. Verifica tu conexión a internet."
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
        toast.error(errorMessage, {
          title: "Error de conexión",
        })
        return { success: false, error: errorMessage }
      }
    },
    [toast],
  )

  // Logout
  const logout = useCallback(async () => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })

    try {
      await authService.logout()
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      toast.info("Has cerrado sesión correctamente", {
        title: "Sesión cerrada",
      })
    } catch (error) {
      console.error("Error en logout:", error)
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    }
  }, [toast])

  // Cambiar contraseña
  const changePassword = useCallback(
    async (passwords) => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      try {
        const result = await authService.changePassword(passwords)

        if (result.success) {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
          toast.success("Tu contraseña ha sido actualizada correctamente", {
            title: "Contraseña actualizada",
          })
          return { success: true }
        } else {
          const errorMessage = result.error || "Error al cambiar contraseña"
          dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
          toast.error(errorMessage, {
            title: "Error al cambiar contraseña",
          })
          return { success: false, error: errorMessage }
        }
      } catch (error) {
        const errorMessage = error.message || "Error al cambiar la contraseña"
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [toast],
  )

  // Actualizar perfil
  const updateProfile = useCallback(async () => {
    try {
      const result = await authService.getProfile()
      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: result.data })
      }
    } catch (error) {
      console.error("Error actualizando perfil:", error)
    }
  }, [])

  // Limpiar error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }, [])

  // Inicializar al montar
  useEffect(() => {
    initialize()
  }, [initialize])

  const value = {
    ...state,
    login,
    logout,
    changePassword,
    updateProfile,
    clearError,
    initialize,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
