import api from "@/config/api"

export const userService = {
  // Obtener todos los usuarios
  getUsers: async () => {
    try {
      const response = await api.get("/auth/users")
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      }
      
      return {
        success: false,
        error: response.data.message || "Error obteniendo usuarios"
      }
    } catch (error) {
      console.error("Error obteniendo usuarios:", error)
      return {
        success: false,
        error: error.response?.data?.message || "Error de conexión"
      }
    }
  },

  // Crear usuario
  createUser: async (userData) => {
    try {
      const response = await api.post("/auth/users", userData)
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      }
      
      return {
        success: false,
        error: response.data.message || "Error creando usuario"
      }
    } catch (error) {
      console.error("Error creando usuario:", error)
      return {
        success: false,
        error: error.response?.data?.message || "Error de conexión"
      }
    }
  },

  // Actualizar usuario
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/auth/users/${id}`, userData)
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message
        }
      }
      
      return {
        success: false,
        error: response.data.message || "Error actualizando usuario"
      }
    } catch (error) {
      console.error("Error actualizando usuario:", error)
      return {
        success: false,
        error: error.response?.data?.message || "Error de conexión"
      }
    }
  },

  // Eliminar usuario
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/auth/users/${id}`)
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message
        }
      }
      
      return {
        success: false,
        error: response.data.message || "Error eliminando usuario"
      }
    } catch (error) {
      console.error("Error eliminando usuario:", error)
      return {
        success: false,
        error: error.response?.data?.message || "Error de conexión"
      }
    }
  }
}

export default userService
