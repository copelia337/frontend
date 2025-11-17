"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import Card from "@/components/common/Card"
import LoadingButton from "../components/common/LoandingButton"
import { useToast } from "@/contexts/ToastContext"
import BusinessConfigTab from "@/components/config/BusinessConfigTab"
import TicketConfigTab from "@/components/config/TicketConfigTab"
import UserManagementTab from "@/components/config/UserManagementTab"
import {
  UserCircleIcon,
  KeyIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingStorefrontIcon,
  ReceiptPercentIcon,
  UsersIcon,
} from "@heroicons/react/24/outline"

const Configuration = () => {
  const { user, changePassword, loading } = useAuth()
  const toast = useToast()
  
  const [activeTab, setActiveTab] = useState("profile")
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordErrors, setPasswordErrors] = useState({})

  const getRoleDisplay = (role) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "empleado":
        return "Empleado"
      default:
        return role || "Usuario"
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "empleado":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))

    // Limpiar errores del campo específico
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  const validatePasswordForm = () => {
    const errors = {}

    if (!passwordData.currentPassword) {
      errors.currentPassword = "La contraseña actual es requerida"
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "La nueva contraseña es requerida"
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "La nueva contraseña debe tener al menos 6 caracteres"
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Confirma la nueva contraseña"
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden"
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = "La nueva contraseña debe ser diferente a la actual"
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!validatePasswordForm()) {
      return
    }

    const result = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    })

    if (result.success) {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setPasswordErrors({})
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const tabs = [
    { id: "profile", name: "Mi Perfil", icon: UserCircleIcon },
    { id: "password", name: "Cambiar Contraseña", icon: KeyIcon },
    { id: "business", name: "Datos del Negocio", icon: BuildingStorefrontIcon },
    { id: "tickets", name: "Configuración de Tickets", icon: ReceiptPercentIcon },
    ...(user?.role === "admin" ? [{ id: "users", name: "Usuarios", icon: UsersIcon }] : []),
    { id: "settings", name: "Configuración", icon: Cog6ToothIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">Gestiona tu perfil y configuración de la cuenta</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "profile" && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Información del Perfil</h3>
              <p className="text-sm text-gray-500">Información básica de tu cuenta</p>
            </Card.Header>
            <Card.Body>
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="h-20 w-20 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{user?.name || "Usuario"}</h4>
                    <p className="text-sm text-gray-500">{user?.email || "email@ejemplo.com"}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getRoleBadgeColor(user?.role)}`}>
                      {getRoleDisplay(user?.role)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <span className="text-sm text-gray-900">{user?.name || "No disponible"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <span className="text-sm text-gray-900">{user?.email || "No disponible"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <span className="text-sm text-gray-900">{getRoleDisplay(user?.role)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {activeTab === "password" && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Cambiar Contraseña</h3>
              <p className="text-sm text-gray-500">Actualiza tu contraseña para mantener tu cuenta segura</p>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Contraseña Actual
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className={`block w-full px-3 py-2 pr-10 border ${
                        passwordErrors.currentPassword ? "border-red-300" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Tu contraseña actual"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility("current")}
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Nueva Contraseña
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={`block w-full px-3 py-2 pr-10 border ${
                        passwordErrors.newPassword ? "border-red-300" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Tu nueva contraseña"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility("new")}
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`block w-full px-3 py-2 pr-10 border ${
                        passwordErrors.confirmPassword ? "border-red-300" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility("confirm")}
                    >
                      {showPasswords.confirm ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <LoadingButton
                    type="submit"
                    loading={loading}
                    loadingText="Actualizando..."
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Actualizar Contraseña
                  </LoadingButton>
                </div>
              </form>
            </Card.Body>
          </Card>
        )}

        {activeTab === "business" && <BusinessConfigTab />}

        {activeTab === "tickets" && <TicketConfigTab />}

        {activeTab === "users" && user?.role === "admin" && <UserManagementTab />}

        {activeTab === "settings" && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Configuración General</h3>
              <p className="text-sm text-gray-500">Configuración adicional del sistema</p>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-8 text-gray-500">
                <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Configuración adicional</p>
                <p className="text-sm">Las opciones de configuración aparecerán aquí próximamente</p>
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Configuration
