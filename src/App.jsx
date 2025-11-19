"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import Layout from "@/components/layout/Layout"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import Sales from "@/pages/Sales"
import Purchases from "@/pages/Purchases"
import Stock from "@/pages/Stock"
import Categories from "@/pages/Categories"
import Cash from "@/pages/Cash"
import Customers from "@/pages/Customers"
import Suppliers from "@/pages/Suppliers"
import Reports from "@/pages/Reports"
import Configuration from "@/pages/Configuration"
import ProtectedRoute from "@/lib/ProtectedRoute"
import { ToastProvider } from "@/contexts/ToastContext"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"

// Tema personalizado para Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: "#0ea5e9",
      light: "#38bdf8",
      dark: "#0284c7",
    },
    secondary: {
      main: "#64748b",
      light: "#94a3b8",
      dark: "#475569",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    h1: {
      fontSize: "2.25rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "1.875rem",
      fontWeight: 600,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "0.5rem",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
  },
})

// Componente interno que usa el contexto de auth
const AppRoutes = () => {
  const { isAuthenticated, initialized } = useAuth()

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      {/* Rutas protegidas */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Rutas anidadas dentro del layout */}
        <Route index element={<Dashboard />} />
        <Route path="ventas" element={<Sales />} />
        <Route path="compras" element={<Purchases />} />
        <Route path="stock" element={<Stock />} />
        <Route path="categorias" element={<Categories />} />
        <Route path="caja" element={<Cash />} />
        <Route path="clientes" element={<Customers />} />
        <Route path="proveedores" element={<Suppliers />} />
        <Route path="reportes" element={<Reports />} />
        
        {/* Rutas que requieren permisos de administrador */}
        <Route
          path="configuracion"
          element={
            <ProtectedRoute requiredRole="admin">
              <Configuration />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <AppRoutes />
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
