import api from "@/config/api"

export const productsService = {
  // Obtener todos los productos
  async getProducts(params = {}) {
    return api.get("/products", { params })
  },

  // NUEVO: Obtener los productos más vendidos para la interfaz de ventas
  async getTopSellingProducts(limit = 10) {
    return api.get("/products/top-selling", { params: { limit } })
  },

  // Obtener producto por ID
  async getProductById(id) {
    return api.get(`/products/${id}`)
  },

  // Crear producto
  async createProduct(productData) {
    return api.post("/products", productData)
  },

  // Actualizar producto
  async updateProduct(id, productData) {
    return api.put(`/products/${id}`, productData)
  },

  // Eliminar producto
  async deleteProduct(id) {
    return api.delete(`/products/${id}`)
  },

  // Obtener movimientos de stock
  async getStockMovements(params = {}) {
    return api.get("/products/movements/list", { params })
  },

  // Crear movimiento de stock
  async createStockMovement(movementData) {
    return api.post("/products/movements", movementData)
  },

  // Obtener alertas de stock
  async getStockAlerts(threshold = 10) {
    return api.get(`/products/alerts`, { params: { threshold } })
  },

  // Obtener estadísticas de stock
  async getStockStats() {
    return api.get("/products/stats")
  },

  // Calcular capital total en stock (precio de venta × stock por producto)
  async getStockCapital() {
    return api.get("/products/stock-capital")
  },
}
