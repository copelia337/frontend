import api from "@/config/api"

const TOKEN_KEY = "token"
const USER_KEY = "user"

export const authService = {
  // Login
  login: async (credentials) => {
    try {
      console.log("🔄 Enviando credenciales de login...")
      const response = await api.post("/auth/login", credentials)

      console.log("📡 Respuesta de login recibida:", response.status)

      if (response.data.success) {
        const { token, user } = response.data.data

        // Guardar token y usuario
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(USER_KEY, JSON.stringify(user))

        // Configurar header de autorización para futuras peticiones
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`

        console.log("✅ Login exitoso, token guardado")
        return {
          success: true,
          data: { user, token },
        }
      } else {
        console.log("❌ Login fallido:", response.data.message)
        return {
          success: false,
          error: response.data.message || "Error en el login",
        }
      }
    } catch (error) {
      console.error("💥 Error en login:", error)

      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message,
        }
      }

      return {
        success: false,
        error: "Error de conexión. Verifica tu conexión a internet.",
      }
    }
  },

  // Logout
  logout: async () => {
    try {
      // Intentar hacer logout en el servidor
      await api.post("/auth/logout")
    } catch (error) {
      console.warn("Error en logout del servidor:", error)
    } finally {
      // Limpiar datos locales siempre
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      delete api.defaults.headers.common["Authorization"]
      console.log("✅ Logout completado, datos locales limpiados")
    }
  },

  // Verificar si está autenticado
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = localStorage.getItem(USER_KEY)

    if (!token || !user) {
      return false
    }

    try {
      // Verificar que el token no esté expirado (básico)
      const payload = JSON.parse(atob(token.split(".")[1]))
      const currentTime = Date.now() / 1000

      if (payload.exp && payload.exp < currentTime) {
        console.log("🔒 Token expirado, limpiando datos")
        authService.logout()
        return false
      }

      // Configurar header de autorización si el token es válido
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      return true
    } catch (error) {
      console.error("Error verificando token:", error)
      authService.logout()
      return false
    }
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem(USER_KEY)
      return user ? JSON.parse(user) : null
    } catch (error) {
      console.error("Error obteniendo usuario:", error)
      return null
    }
  },

  // Obtener token
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY)
  },

  // Cambiar contraseña
  changePassword: async (passwords) => {
    try {
      const response = await api.post("/auth/change-password", passwords)

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
        }
      } else {
        return {
          success: false,
          error: response.data.message || "Error al cambiar contraseña",
        }
      }
    } catch (error) {
      console.error("Error cambiando contraseña:", error)

      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message,
        }
      }

      return {
        success: false,
        error: "Error de conexión",
      }
    }
  },

  // Obtener perfil actualizado
  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile")

      if (response.data.success) {
        const user = response.data.data
        localStorage.setItem(USER_KEY, JSON.stringify(user))

        return {
          success: true,
          data: user,
        }
      } else {
        return {
          success: false,
          error: response.data.message || "Error obteniendo perfil",
        }
      }
    } catch (error) {
      console.error("Error obteniendo perfil:", error)

      if (error.response?.status === 401) {
        // Token expirado, hacer logout
        await authService.logout()
        return {
          success: false,
          error: "Sesión expirada",
        }
      }

      return {
        success: false,
        error: "Error de conexión",
      }
    }
  },

  // Refrescar token (si implementas refresh tokens)
  refreshToken: async () => {
    try {
      const response = await api.post("/auth/refresh")

      if (response.data.success) {
        const { token } = response.data.data
        localStorage.setItem(TOKEN_KEY, token)
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`

        return {
          success: true,
          token,
        }
      }

      return {
        success: false,
        error: "Error refrescando token",
      }
    } catch (error) {
      console.error("Error refrescando token:", error)
      await authService.logout()
      return {
        success: false,
        error: "Error refrescando token",
      }
    }
  },
}

export default authService
