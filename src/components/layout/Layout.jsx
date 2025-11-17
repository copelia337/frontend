"use client"

import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"
import { useAuth } from "@/contexts/AuthContext"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  
  useKeyboardShortcuts()

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar para móvil */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={true} />

      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar sidebarOpen={true} setSidebarOpen={setSidebarOpen} isMobile={false} />
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-72 flex flex-col flex-1">
        <Header setSidebarOpen={setSidebarOpen} user={user} />

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
