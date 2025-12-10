"use client"

import { Fragment, useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { NumericFormat } from "react-number-format"
import Button from "../common/Button"
import {
  XMarkIcon,
  PercentBadgeIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"

const DiscountModal = ({ isOpen, onClose, subtotal, onApplyDiscount }) => {
  const [discountType, setDiscountType] = useState("percentage") // "percentage" or "amount"
  const [discountValue, setDiscountValue] = useState(0)
  const [error, setError] = useState("")

  // Reset cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setDiscountType("percentage")
      setDiscountValue(0)
      setError("")
    }
  }, [isOpen])

  const handleValueChange = (values) => {
    const { floatValue } = values
    setDiscountValue(floatValue || 0)
    setError("")
  }

  const calculateDiscountAmount = () => {
    if (discountType === "percentage") {
      return (subtotal * discountValue) / 100
    }
    return discountValue
  }

  const finalDiscountAmount = calculateDiscountAmount()
  const finalTotal = Math.max(0, subtotal - finalDiscountAmount)

  const handleApply = () => {
    // Validaciones
    if (!discountValue || discountValue <= 0) {
      setError("El descuento debe ser mayor a 0")
      return
    }

    if (discountType === "percentage" && discountValue > 100) {
      setError("El porcentaje no puede ser mayor a 100%")
      return
    }

    if (discountType === "amount" && discountValue > subtotal) {
      setError("El descuento no puede ser mayor al subtotal")
      return
    }

    // Aplicar descuento
    onApplyDiscount(finalDiscountAmount)
    onClose()
  }

  const handleRemoveDiscount = () => {
    onApplyDiscount(0)
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                        <PercentBadgeIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                        Aplicar Descuento
                      </Dialog.Title>
                      <p className="text-sm text-gray-500 mt-0.5">Por porcentaje o monto fijo</p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-6">
                  {/* Tipo de descuento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de descuento</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType("percentage")
                          setDiscountValue(0)
                          setError("")
                        }}
                        className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all ${
                          discountType === "percentage"
                            ? "border-orange-500 bg-orange-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <PercentBadgeIcon
                          className={`h-6 w-6 mr-2 ${
                            discountType === "percentage" ? "text-orange-600" : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            discountType === "percentage" ? "text-orange-900" : "text-gray-600"
                          }`}
                        >
                          Porcentaje
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType("amount")
                          setDiscountValue(0)
                          setError("")
                        }}
                        className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all ${
                          discountType === "amount"
                            ? "border-orange-500 bg-orange-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <CurrencyDollarIcon
                          className={`h-6 w-6 mr-2 ${discountType === "amount" ? "text-orange-600" : "text-gray-400"}`}
                        />
                        <span
                          className={`font-medium ${discountType === "amount" ? "text-orange-900" : "text-gray-600"}`}
                        >
                          Monto
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Valor del descuento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {discountType === "percentage" ? "Porcentaje de descuento" : "Monto del descuento"}
                    </label>
                    {discountType === "percentage" ? (
                      <NumericFormat
                        value={discountValue || ""}
                        onValueChange={handleValueChange}
                        thousandSeparator="."
                        decimalSeparator=","
                        suffix=" %"
                        decimalScale={2}
                        allowNegative={false}
                        className={`w-full px-4 py-4 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-xl font-bold text-center ${
                          error ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"
                        }`}
                        placeholder="0 %"
                      />
                    ) : (
                      <NumericFormat
                        value={discountValue || ""}
                        onValueChange={handleValueChange}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="$ "
                        decimalScale={2}
                        allowNegative={false}
                        className={`w-full px-4 py-4 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-xl font-bold text-center ${
                          error ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"
                        }`}
                        placeholder="$ 0,00"
                      />
                    )}
                    {error && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {error}
                      </p>
                    )}
                  </div>

                  {/* Resumen */}
                  {discountValue > 0 && !error && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                      <h4 className="text-sm font-semibold text-orange-900 mb-3">Resumen</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-orange-700">Subtotal:</span>
                          <span className="font-medium text-orange-900">
                            {new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency: "ARS",
                            }).format(subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-orange-700">Descuento:</span>
                          <span className="font-medium text-red-600">
                            -{" "}
                            {new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency: "ARS",
                            }).format(finalDiscountAmount)}
                          </span>
                        </div>
                        <div className="border-t border-orange-300 pt-2">
                          <div className="flex justify-between">
                            <span className="text-base font-bold text-orange-900">Total:</span>
                            <span className="text-base font-bold text-orange-900">
                              {new Intl.NumberFormat("es-AR", {
                                style: "currency",
                                currency: "ARS",
                              }).format(finalTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveDiscount}
                    className="flex-1 py-3 text-sm font-medium rounded-xl bg-transparent"
                  >
                    Quitar Descuento
                  </Button>
                  <Button
                    onClick={handleApply}
                    className="flex-1 py-3 text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-lg"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Aplicar
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default DiscountModal
