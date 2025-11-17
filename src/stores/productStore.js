import { create } from "zustand"
import { productsService } from "../services/productsService"

export const useProductStore = create((set, get) => ({
  products: [],
  topSellingProducts: [], 
  searchResults: [], 
  loading: false,
  error: null,
  lastFetch: null,
  lastFetchTopSelling: null, 
  lastSearchQuery: null, 
  lastSearchFetch: null, 
  lastParamsKey: null, 
  pagination: {
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  },
  searchPagination: {
    page: 1,
    limit: 5, // Reducir límite a 5 para búsquedas más rápidas
    total: 0,
    pages: 0,
    hasMore: false, // Indicador para saber si hay más resultados
  },

  // Acciones
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchTopSellingProducts: async (limit = 10, forceRefresh = false) => {
    const state = get()

    if (state.loading && !forceRefresh) {
      return state.topSellingProducts
    }

    const now = Date.now()
    const cacheTime = 10 * 1000 

    if (
      !forceRefresh &&
      state.lastFetchTopSelling &&
      now - state.lastFetchTopSelling < cacheTime &&
      state.topSellingProducts.length > 0
    ) {
      return state.topSellingProducts
    }

    set({ loading: true, error: null })
    try {
      const response = await productsService.getTopSellingProducts(limit)
      const topProducts = response.data.data.products || []

      set({
        topSellingProducts: topProducts,
        loading: false,
        lastFetchTopSelling: now,
      })
      return topProducts
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || "Error al cargar productos más vendidos",
        loading: false,
      })
      throw error
    }
  },

  searchProductsForSales: async (query, page = 1, forceRefresh = false) => {
    const state = get()

    if (!query || query.trim().length < 2) {
      set({ searchResults: [], searchPagination: { ...state.searchPagination, page: 1, total: 0, hasMore: false } })
      return []
    }

    const trimmedQuery = query.trim()

    const now = Date.now()
    const cacheTime = 2 * 1000 

    if (
      !forceRefresh &&
      state.lastSearchQuery === trimmedQuery &&
      state.searchPagination.page === page &&
      state.lastSearchFetch &&
      now - state.lastSearchFetch < cacheTime &&
      state.searchResults.length >= 0
    ) {
      return state.searchResults
    }

    set({ loading: true, error: null })
    try {
      const params = {
        search: trimmedQuery,
        active: "true", 
        page: page,
        limit: 5, // Solo 5 productos por petición
      }

      const response = await productsService.getProducts(params)
      const newResults = response.data.data.products || []
      const paginationData = response.data.data.pagination

      const updatedResults = page === 1 ? newResults : [...state.searchResults, ...newResults]

      set({
        searchResults: updatedResults,
        searchPagination: {
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          pages: paginationData.pages,
          hasMore: paginationData.page < paginationData.pages, // Indicar si hay más páginas
        },
        loading: false,
        lastSearchQuery: trimmedQuery,
        lastSearchFetch: now,
      })
      return updatedResults
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || "Error al buscar productos",
        loading: false,
        searchResults: [],
      })
      throw error
    }
  },

  loadMoreSearchResults: async () => {
    const state = get()
    if (!state.searchPagination.hasMore || state.loading) {
      return state.searchResults
    }

    const nextPage = state.searchPagination.page + 1
    return get().searchProductsForSales(state.lastSearchQuery, nextPage, false)
  },

  // Obtener productos con paginación (mantener funcionalidad original)
  fetchProducts: async (params = {}, forceRefresh = false) => {
    const state = get()

    if (state.loading && !forceRefresh) {
      return state.products
    }

    const now = Date.now()
    const cacheTime = 30 * 1000 
    const paramsKey = JSON.stringify(params)

    if (
      !forceRefresh &&
      state.lastFetch &&
      now - state.lastFetch < cacheTime &&
      state.lastParamsKey === paramsKey &&
      state.products.length > 0
    ) {
      return state.products
    }

    set({ loading: true, error: null })
    try {
      const response = await productsService.getProducts(params)
      set({
        products: response.data.data.products,
        pagination: response.data.data.pagination,
        loading: false,
        lastFetch: now,
        lastParamsKey: paramsKey,
      })
      return response.data.data.products
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || "Error al cargar productos",
        loading: false,
      })
      throw error
    }
  },

  fetchProductById: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await productsService.getProductById(id)
      set({ loading: false })
      return response.data.data
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || "Error al cargar producto",
        loading: false,
      })
      throw error
    }
  },

  createProduct: async (productData) => {
    set({ loading: true, error: null })
    try {
      const response = await productsService.createProduct(productData)
      set({ loading: false })
      set({ lastFetchTopSelling: null, lastSearchFetch: null })
      return response.data.data
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || "Error al crear producto",
        loading: false,
      })
      throw error
    }
  },

  updateProduct: async (id, productData) => {
    set({ loading: true, error: null })
    try {
      const response = await productsService.updateProduct(id, productData)

      set((state) => ({
        products: state.products.map((product) => (product.id === id ? response.data.data : product)),
        topSellingProducts: state.topSellingProducts.map((product) =>
          product.id === id ? response.data.data : product,
        ),
        searchResults: state.searchResults.map((product) => (product.id === id ? response.data.data : product)),
        loading: false,
        lastFetchTopSelling: null,
        lastSearchFetch: null,
      }))

      return response.data.data
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || "Error al actualizar producto",
        loading: false,
      })
      throw error
    }
  },

  updateStock: (productId, newStock) => {
    set((state) => ({
      products: state.products.map((product) => (product.id === productId ? { ...product, stock: newStock } : product)),
      topSellingProducts: state.topSellingProducts.map((product) =>
        product.id === productId ? { ...product, stock: newStock } : product,
      ),
      searchResults: state.searchResults.map((product) =>
        product.id === productId ? { ...product, stock: newStock } : product,
      ),
    }))
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await productsService.deleteProduct(id)

      set((state) => {
        if (response.data.action === "deleted") {
          return {
            products: state.products.filter((product) => product.id !== id),
            topSellingProducts: state.topSellingProducts.filter((product) => product.id !== id),
            searchResults: state.searchResults.filter((product) => product.id !== id),
            loading: false,
            lastFetchTopSelling: null,
            lastSearchFetch: null,
          }
        } else {
          return {
            products: state.products.map((product) => (product.id === id ? { ...product, active: false } : product)),
            topSellingProducts: state.topSellingProducts.filter((product) => product.id !== id),
            searchResults: state.searchResults.filter((product) => product.id !== id),
            loading: false,
            lastFetchTopSelling: null,
            lastSearchFetch: null,
          }
        }
      })

      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || "Error al eliminar producto",
        loading: false,
      })
      throw error
    }
  },

  getTopSellingProducts: () => get().topSellingProducts,
  getProducts: () => get().products.filter((p) => p.active),
  getAllProducts: () => get().products,
  getProductById: (id) => {
    const searchResult = get().searchResults.find((p) => p.id === id)
    if (searchResult) return searchResult

    const topProduct = get().topSellingProducts.find((p) => p.id === id)
    if (topProduct) return topProduct

    return get().products.find((p) => p.id === id)
  },
  getProductByBarcode: (barcode) => {
    const searchResult = get().searchResults.find((p) => p.barcode === barcode)
    if (searchResult) return searchResult

    const topProduct = get().topSellingProducts.find((p) => p.barcode === barcode)
    if (topProduct) return topProduct

    return get().products.find((p) => p.barcode === barcode)
  },

  getProductsByCategory: (categoryId) => {
    const topProducts = get().topSellingProducts.filter(
      (product) => product.category_id === categoryId && product.active,
    )
    if (topProducts.length > 0) return topProducts

    return get().products.filter((product) => product.category_id === categoryId && product.active)
  },

  searchProducts: (query) => {
    if (!query) return get().topSellingProducts.length > 0 ? get().topSellingProducts : get().products

    const topProducts = get().topSellingProducts
    const allProducts = get().products

    if (topProducts.length > 0) {
      const topResults = topProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description?.toLowerCase().includes(query.toLowerCase()) ||
          product.barcode?.includes(query),
      )
      if (topResults.length > 0) return topResults
    }

    return allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase()) ||
        product.barcode?.includes(query),
    )
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      products: [],
      topSellingProducts: [],
      searchResults: [],
      loading: false,
      error: null,
      lastFetch: null,
      lastFetchTopSelling: null,
      lastSearchQuery: null,
      lastSearchFetch: null,
      lastParamsKey: null,
      pagination: {
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      },
      searchPagination: {
        page: 1,
        limit: 5,
        total: 0,
        pages: 0,
        hasMore: false,
      },
    }),
}))
