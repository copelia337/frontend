"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { useProductStore } from "../../stores/productStore"
import { formatCurrency, formatStock } from "../../lib/formatters"
import Button from "../common/Button"
import LoadingSpinner from "../common/LoadingSpinner"
import {
  XMarkIcon,
  BanknotesIcon,
  CubeIcon,
  ExclamationCircleIcon,
  ScaleIcon,
  TagIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline"

const TABS = [
  { id: "venta", label: "Precio de venta", icon: CurrencyDollarIcon },
  { id: "costo", label: "Precio de costo", icon: TagIcon },
]

const StockCapitalModal = ({ isOpen, onClose }) => {
  const { fetchStockCapital, stockCapitalLoading, error, clearError } = useProductStore()
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState("venta")

  const loadCapital = useCallback(async () => {
    setData(null)
    clearError?.()
    try {
      const result = await fetchStockCapital()
      setData(result)
    } catch {
      // Error ya manejado en el store
    }
  }, [fetchStockCapital, clearError])

  useEffect(() => {
    if (isOpen) {
      loadCapital()
    } else {
      setData(null)
    }
  }, [isOpen, loadCapital])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <BanknotesIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Capital en stock
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        Valor total del inventario según precio de venta o costo
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Cerrar"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="px-6 py-5">
                  {stockCapitalLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <LoadingSpinner size="xl" className="text-primary-600" />
                      <p className="mt-4 text-sm font-medium text-gray-600">
                        Calculando capital en stock...
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Calculando total por precio de venta y por costo
                      </p>
                    </div>
                  )}

                  {!stockCapitalLoading && error && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                        <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
                      </div>
                      <p className="mt-4 text-center text-sm font-medium text-gray-900">
                        No se pudo calcular el capital
                      </p>
                      <p className="mt-1 text-center text-sm text-gray-500">{error}</p>
                      <Button variant="outline" className="mt-6" onClick={loadCapital}>
                        Reintentar
                      </Button>
                    </div>
                  )}

                  {!stockCapitalLoading && !error && data && (
                    <div className="space-y-6">
                      {/* Tabs: Precio de venta / Precio de costo */}
                      <div className="border-b border-gray-200">
                        <nav className="-mb-px flex gap-1" aria-label="Tipo de precio">
                          {TABS.map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveTab(tab.id)}
                              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors rounded-t-lg ${
                                activeTab === tab.id
                                  ? "border-primary-500 text-primary-600 bg-primary-50/50"
                                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              <tab.icon className="h-4 w-4" />
                              {tab.label}
                            </button>
                          ))}
                        </nav>
                      </div>

                      <div className={`rounded-xl border p-6 ${
                        activeTab === "venta"
                          ? "bg-primary-50 border-primary-100"
                          : "bg-emerald-50 border-emerald-100"
                      }`}>
                        <p className="text-sm font-medium text-gray-700">
                          {activeTab === "venta"
                            ? "Total en pesos (stock × precio de venta)"
                            : "Total en pesos (stock × precio de costo)"}
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">
                          {formatCurrency(
                            activeTab === "venta" ? data.totalCapitalVenta : data.totalCapitalCosto
                          )}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                          {data.productCount} producto{data.productCount !== 1 ? "s" : ""} con stock
                        </p>
                      </div>

                      {data.items && data.items.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Desglose por producto</h4>
                          <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Producto
                                  </th>
                                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock
                                  </th>
                                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {activeTab === "venta" ? "P. venta" : "P. costo"}
                                  </th>
                                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {data.items.map((item) => (
                                  <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                                      {item.name}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-600 text-right whitespace-nowrap">
                                      {item.unit_type === "kg" ? (
                                        <span className="inline-flex items-center gap-1">
                                          {formatStock(item.stock, item.unit_type, false)}
                                          <ScaleIcon className="h-3.5 w-3.5 text-gray-400" />
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1">
                                          {formatStock(item.stock, item.unit_type, false)}
                                          <CubeIcon className="h-3.5 w-3.5 text-gray-400" />
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-600 text-right tabular-nums">
                                      {formatCurrency(activeTab === "venta" ? item.price : item.cost)}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 text-right tabular-nums">
                                      {formatCurrency(
                                        activeTab === "venta" ? item.valueVenta : item.valueCosto
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay productos con stock para mostrar en el desglose.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {!stockCapitalLoading && (data || error) && (
                  <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <Button variant="outline" onClick={handleClose}>
                      Cerrar
                    </Button>
                    {data && (
                      <Button onClick={loadCapital}>
                        Recalcular
                      </Button>
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default StockCapitalModal
