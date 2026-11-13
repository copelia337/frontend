import api from "@/config/api"

export const reportsService = {
  // Obtener estadísticas generales de reportes
  getReportsStats: async (params = {}) => {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key])
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `/reports/stats?${queryString}` : "/reports/stats"

    return await api.get(url)
  },

  // Obtener reporte de ventas
  getSalesReport: async (params = {}) => {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key])
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `/reports/sales?${queryString}` : "/reports/sales"

    return await api.get(url)
  },

  // Obtener reporte diario de ventas
  getDailySalesReport: async (startDate, endDate) => {
    const params = new URLSearchParams()
    if (startDate) params.append("start_date", startDate)
    if (endDate) params.append("end_date", endDate)

    const queryString = params.toString()
    const url = queryString ? `/sales/report/daily?${queryString}` : "/sales/report/daily"

    return await api.get(url)
  },

  // Obtener productos más vendidos
  getTopProducts: async (params = {}) => {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key])
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `/reports/products/top?${queryString}` : "/reports/products/top"

    return await api.get(url)
  },

  // Obtener mejores clientes
  getTopCustomers: async (params = {}) => {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key])
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `/reports/customers/top?${queryString}` : "/reports/customers/top"

    return await api.get(url)
  },

  // Obtener reporte de inventario
  getInventoryReport: async (params = {}) => {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key])
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `/reports/inventory?${queryString}` : "/reports/inventory"

    return await api.get(url)
  },

  // Obtener ventas por categoría
  getSalesByCategory: async (params = {}) => {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key])
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `/reports/categories?${queryString}` : "/reports/categories"

    return await api.get(url)
  },

  // Obtener ventas por método de pago
  getSalesByPaymentMethod: async (params = {}) => {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key])
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `/reports/payment-methods?${queryString}` : "/reports/payment-methods"

    return await api.get(url)
  },

  // Ganancias del rango: venta menos costo, con egresos de caja
  getProfitsReport: async (params = {}) => {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key])
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `/reports/profits?${queryString}` : "/reports/profits"

    return await api.get(url)
  },

  // Obtener estadísticas de ventas (desde sales controller)
  getSalesStats: async (params = {}) => {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key])
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `/sales/stats?${queryString}` : "/sales/stats"

    return await api.get(url)
  },
}
