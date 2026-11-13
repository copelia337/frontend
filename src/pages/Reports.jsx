"use client"

import { useState, useEffect } from "react"
import { useReportsStore } from "../stores/reportsStore"
import { formatCurrency, formatNumber } from "../lib/formatters"
import LoadingSpinner from "../components/common/LoadingSpinner"
import SalesChart from "../components/reports/SalesChart"
import CategoryChart from "../components/reports/CategoryChart"
import PaymentMethodsChart from "../components/reports/PaymentMethodsChart"
import SalesHistoryTable from "../components/reports/SalesHistoryTable"
import SalesAnalysisFilters from "../components/reports/SalesAnalysisFilters"
import ProfitsReport from "../components/reports/ProfitsReport"
import {
CurrencyDollarIcon,
ShoppingCartIcon,
ArrowUpIcon,
ArrowDownIcon,
ClockIcon,
ChartBarIcon,
} from "@heroicons/react/24/outline"

const Reports = () => {
const { getSalesStats, getGrowthData, loading, error, generateReports } = useReportsStore()
const [activeTab, setActiveTab] = useState("history")

const stats = getSalesStats()
const growth = getGrowthData()

useEffect(() => {
  generateReports()
}, [generateReports])

const tabs = [
  { id: "history", name: "Historial", icon: ClockIcon },
  { id: "profits", name: "Ganancias", icon: ChartBarIcon },
  { id: "sales", name: "Análisis de Ventas", icon: CurrencyDollarIcon },
]

const StatCard = ({ title, value, change, icon: Icon, format = "currency", color = "text-gray-600" }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd className="flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">
              {format === "currency" ? formatCurrency(value) : formatNumber(value)}
            </div>
            {change !== undefined && (
              <div
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {change >= 0 ? (
                  <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                )}
                <span className="sr-only">{change >= 0 ? "Aumentó" : "Disminuyó"} en</span>
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </dd>
        </dl>
      </div>
    </div>
  </div>
)

return (
  <div className="space-y-6">
    {/* Header */}
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
      <p className="mt-1 text-sm text-gray-500">Analiza el rendimiento de tu negocio con datos detallados</p>
    </div>

    {/* Tabs */}
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <tab.icon className="h-5 w-5 mr-2" />
            {tab.name}
          </button>
        ))}
      </nav>
    </div>

    {/* Contenido de tabs */}
    {activeTab === "history" && (
      <div className="space-y-6">
        <SalesHistoryTable />
      </div>
    )}

    {activeTab === "profits" && (
      <div className="space-y-6">
        <ProfitsReport />
      </div>
    )}

    {activeTab === "sales" && (
      <div className="space-y-6">
        {/* Filtros de análisis de ventas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Período de Análisis</h3>
              <p className="text-sm text-gray-500">Selecciona el rango de fechas para analizar</p>
            </div>
            <SalesAnalysisFilters />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center min-h-64 bg-white rounded-lg border border-gray-200">
            <LoadingSpinner size="xl" />
            <span className="ml-3 text-lg text-gray-600">Generando reportes...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center min-h-64 bg-white rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="text-red-500 text-lg font-medium mb-2">Error al cargar reportes</div>
              <div className="text-gray-600 mb-4">{error}</div>
              <button
                onClick={() => generateReports()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
        <>
        {/* Estadísticas principales - Solo ingresos y transacciones */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StatCard
            title="Ingresos Totales"
            value={stats.totalRevenue}
            change={growth.revenue}
            icon={CurrencyDollarIcon}
            color="text-green-600"
          />
          <StatCard
            title="Transacciones"
            value={stats.totalTransactions}
            change={growth.transactions}
            icon={ShoppingCartIcon}
            color="text-blue-600"
            format="number"
          />
        </div>

        {/* Gráfico de ventas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tendencia de Ventas</h3>
          </div>
          <div className="p-6">
            <SalesChart />
          </div>
        </div>

        {/* Gráficos de distribución */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Distribución por Categoría</h3>
            </div>
            <div className="p-6">
              <CategoryChart />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Métodos de Pago</h3>
            </div>
            <div className="p-6">
              <PaymentMethodsChart />
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    )}
  </div>
)
}

export default Reports
