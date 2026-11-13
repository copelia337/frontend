"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns"
import {
  BanknotesIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { reportsService } from "../../services/reportsService"
import { formatCurrency, formatDateTime, formatQuantity } from "../../lib/formatters"
import LoadingSpinner from "../common/LoadingSpinner"
import Pagination from "../common/Pagination"

const PAGE_SIZE = 20

const PRESETS = [
  { id: "today", label: "Hoy" },
  { id: "month", label: "Este mes" },
  { id: "lastMonth", label: "Mes anterior" },
  { id: "year", label: "Este año" },
]

const PAYMENT_LABELS = {
  efectivo: "Efectivo",
  tarjeta_credito: "Tarjeta de crédito",
  tarjeta_debito: "Tarjeta de débito",
  transferencia: "Transferencia",
  cuenta_corriente: "Cuenta corriente",
  multiple: "Múltiples métodos",
}

const EXPENSE_LABELS = {
  expense: "Gasto",
  withdrawal: "Retiro",
}

function toCents(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * 100)
}

function fromCents(cents) {
  return Math.round(cents) / 100
}

function formatPercent(value) {
  const amount = Number(value) || 0
  return `${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)}%`
}

function formatIsoDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "Sin fecha"
  const [year, month, day] = isoDate.split("-")
  return `${day}/${month}/${year}`
}

function amountClass(value, emphasize = false) {
  const amount = Number(value) || 0
  const weight = emphasize ? "font-semibold" : "font-medium"
  if (amount < 0) return `${weight} text-red-600`
  if (amount > 0) return `${weight} text-emerald-700`
  return `${weight} text-gray-900`
}

function presetRange(preset) {
  const today = new Date()
  if (preset === "today") {
    const day = format(today, "yyyy-MM-dd")
    return { start: day, end: day }
  }
  if (preset === "lastMonth") {
    const previous = subMonths(today, 1)
    return {
      start: format(startOfMonth(previous), "yyyy-MM-dd"),
      end: format(endOfMonth(previous), "yyyy-MM-dd"),
    }
  }
  if (preset === "year") {
    return {
      start: format(startOfYear(today), "yyyy-MM-dd"),
      end: format(endOfYear(today), "yyyy-MM-dd"),
    }
  }
  return {
    start: format(startOfMonth(today), "yyyy-MM-dd"),
    end: format(endOfMonth(today), "yyyy-MM-dd"),
  }
}

function buildDailyRows(sales, expenses) {
  const days = new Map()
  const ensure = (date) => {
    if (!date) return null
    if (!days.has(date)) {
      days.set(date, { date, sales: 0, cost: 0, profit: 0, expenses: 0, count: 0, expenseCount: 0 })
    }
    return days.get(date)
  }

  sales.forEach((sale) => {
    const day = ensure(sale.sale_date)
    if (!day) return
    day.sales += toCents(sale.total)
    day.cost += toCents(sale.cost)
    day.profit += toCents(sale.profit)
    day.count += 1
  })

  expenses.forEach((expense) => {
    const day = ensure(expense.sale_date)
    if (!day) return
    day.expenses += toCents(expense.amount)
    day.expenseCount += 1
  })

  return Array.from(days.values())
    .map((day) => ({
      date: day.date,
      count: day.count,
      expenseCount: day.expenseCount,
      sales: fromCents(day.sales),
      cost: fromCents(day.cost),
      profit: fromCents(day.profit),
      expenses: fromCents(day.expenses),
      net: fromCents(day.profit - day.expenses),
      salesResult: fromCents(day.sales - day.expenses),
      margin: day.sales ? Math.round((day.profit / day.sales) * 1000) / 10 : 0,
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

function sumSales(sales) {
  return sales.reduce(
    (totals, sale) => {
      totals.total += toCents(sale.total)
      totals.cost += toCents(sale.cost)
      totals.profit += toCents(sale.profit)
      return totals
    },
    { total: 0, cost: 0, profit: 0 },
  )
}

const ProfitsReport = () => {
  const initialRange = presetRange("month")
  const [startDate, setStartDate] = useState(initialRange.start)
  const [endDate, setEndDate] = useState(initialRange.end)
  const [activePreset, setActivePreset] = useState("month")
  const [useSalesBase, setUseSalesBase] = useState(false)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [expandedSaleId, setExpandedSaleId] = useState(null)
  const [showExpenses, setShowExpenses] = useState(false)
  const [expenseDay, setExpenseDay] = useState(null)

  const rangeIsValid = Boolean(startDate && endDate && startDate <= endDate)

  useEffect(() => {
    if (!rangeIsValid) return undefined

    let ignore = false
    setLoading(true)
    setError("")

    reportsService
      .getProfitsReport({ start_date: startDate, end_date: endDate })
      .then((response) => {
        if (ignore) return
        if (response?.data?.success) {
          setReport(response.data.data)
        } else {
          setReport(null)
          setError(response?.data?.message || "No se pudo calcular las ganancias")
        }
      })
      .catch((requestError) => {
        if (ignore) return
        setReport(null)
        const status = requestError.response?.status
        setError(
          status === 404
            ? "El servidor todavía no tiene el reporte de ganancias. Hay que actualizar el backend."
            : requestError.response?.data?.message || requestError.message || "No se pudo calcular las ganancias",
        )
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [startDate, endDate, rangeIsValid])

  useEffect(() => {
    setPage(1)
    setExpandedSaleId(null)
  }, [search, startDate, endDate])

  const summary = report?.summary
  const sales = report?.sales || []
  const expenses = report?.expenses || []

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sales
    return sales.filter((sale) => {
      if (String(sale.id).includes(query)) return true
      if ((sale.customer_name || "").toLowerCase().includes(query)) return true
      return (sale.items || []).some((item) => (item.product_name || "").toLowerCase().includes(query))
    })
  }, [sales, search])

  const dailyRows = useMemo(() => buildDailyRows(sales, expenses), [sales, expenses])
  const filteredTotals = useMemo(() => sumSales(filteredSales), [filteredSales])
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageSales = filteredSales.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const visibleExpenses = expenseDay ? expenses.filter((expense) => expense.sale_date === expenseDay) : expenses
  const visibleExpenseTotal = fromCents(visibleExpenses.reduce((sum, expense) => sum + toCents(expense.amount), 0))

  const result = summary ? (useSalesBase ? summary.sales_result : summary.net_profit) : 0
  const resultBase = summary ? (useSalesBase ? summary.sales_total : summary.gross_profit) : 0
  const resultLabel = useSalesBase ? "Resultado sobre ventas" : "Ganancia neta"

  const applyPreset = (preset) => {
    const range = presetRange(preset)
    setActivePreset(preset)
    setStartDate(range.start)
    setEndDate(range.end)
  }

  const openExpenses = (day = null) => {
    setExpenseDay(day)
    setShowExpenses(true)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Rango de ganancias</h3>
              <p className="text-sm text-gray-500">
                Elegí desde qué día hasta qué día querés ver el resultado. El mes completo, por ejemplo del 1 al 31, entra completo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`px-3 py-1.5 rounded-md text-sm border ${
                    activePreset === preset.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center gap-4 xl:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <CalendarIcon className="hidden sm:block h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => {
                  setActivePreset("custom")
                  setStartDate(event.target.value)
                }}
                className="block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-500 text-sm">hasta</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => {
                  setActivePreset("custom")
                  setEndDate(event.target.value)
                }}
                className="block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <label className="inline-flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useSalesBase}
                onChange={(event) => setUseSalesBase(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">Calcular en base a las ventas</span>
                <span className="block text-xs text-gray-500">
                  {useSalesBase
                    ? "Usa el total cobrado y le resta los egresos."
                    : "Usa la ganancia real: venta menos costo, y le resta los egresos."}
                </span>
              </span>
            </label>
          </div>
          {!rangeIsValid && (
            <p className="text-sm text-red-600">La fecha inicial tiene que ser anterior o igual a la fecha final.</p>
          )}
        </div>
      </div>

      {loading && !report && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Calculando ganancias...</span>
        </div>
      )}

      {error && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 text-center">
          <p className="text-red-600 font-medium">No se pudieron cargar las ganancias</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard
              title="Ventas"
              value={summary.sales_total}
              detail={`${summary.sales_count} venta${summary.sales_count === 1 ? "" : "s"} completada${summary.sales_count === 1 ? "" : "s"}`}
              active={useSalesBase}
            />
            <SummaryCard
              title="Costo"
              value={summary.cost_total}
              detail="Costo de los productos vendidos"
              muted
            />
            <SummaryCard
              title="Ganancia bruta"
              value={summary.gross_profit}
              detail={`Margen ${formatPercent(summary.gross_margin)}`}
              tone="auto"
              active={!useSalesBase}
            />
            <button
              type="button"
              onClick={() => openExpenses(null)}
              className="text-left bg-white rounded-lg shadow-sm border border-red-200 p-5 hover:bg-red-50 transition-colors"
            >
              <p className="text-sm font-medium text-red-700">Egresos</p>
              <p className={`mt-2 text-2xl ${summary.expenses_total > 0 ? "text-red-600" : "text-gray-900"} font-semibold`}>
                {formatCurrency(summary.expenses_total)}
              </p>
              <p className="mt-1 text-xs text-red-600">
                Ver detalle · {summary.expenses_count} movimiento{summary.expenses_count === 1 ? "" : "s"}
              </p>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{resultLabel}</p>
                <p className={`mt-1 text-4xl ${amountClass(result, true)}`}>{formatCurrency(result)}</p>
                <p className="mt-3 text-sm text-gray-600">
                  {formatCurrency(resultBase)} − {formatCurrency(summary.expenses_total)} de egresos ={" "}
                  <span className={amountClass(result)}>{formatCurrency(result)}</span>
                </p>
              </div>
              <div className="text-sm text-gray-500 max-w-xl">
                {useSalesBase ? (
                  <p>
                    Estás viendo el total cobrado en el período, sin restar el costo de los productos. Los egresos ya están descontados.
                  </p>
                ) : (
                  <p>
                    Cada venta resta el costo del producto al precio cobrado. Si vendés a {formatCurrency(10000)} algo que cuesta {formatCurrency(5000)}, la ganancia es {formatCurrency(5000)} y el margen es 50%. Las ventas nuevas guardan ese costo; las anteriores usan el costo actual del producto. Después se restan los egresos.
                  </p>
                )}
                <p className="mt-2">
                  Egresos: {formatCurrency(summary.expense_amount)} en gastos y {formatCurrency(summary.withdrawal_amount)} en retiros.
                </p>
              </div>
            </div>
            {summary.missing_cost_items > 0 && (
              <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                {summary.missing_cost_items} producto{summary.missing_cost_items === 1 ? "" : "s"} del período figuran con costo 0. Esos ítems suman toda la venta como ganancia hasta que les cargues el costo.
              </div>
            )}
            {summary.cancelled_count > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                Hay {summary.cancelled_count} venta{summary.cancelled_count === 1 ? "" : "s"} cancelada{summary.cancelled_count === 1 ? "" : "s"} ({formatCurrency(summary.cancelled_total)}) que no entran en este total.
              </p>
            )}
            {loading && <p className="mt-3 text-xs text-blue-600">Actualizando el rango...</p>}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Detalle por día</h3>
              <p className="text-sm text-gray-500">Así se compone el total del {formatIsoDate(startDate)} al {formatIsoDate(endDate)}.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Fecha", "Cant.", "Cobrado", "Costo", "Ganancia", "Margen", "Egresos", useSalesBase ? "Resultado" : "Ganancia neta"].map((label) => (
                      <th key={label} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyRows.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-sm text-gray-500">
                        No hay ventas ni egresos en este rango.
                      </td>
                    </tr>
                  ) : (
                    dailyRows.map((day) => {
                      const dayResult = useSalesBase ? day.salesResult : day.net
                      return (
                        <tr key={day.date}>
                          <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{formatIsoDate(day.date)}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{day.count}</td>
                          <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{formatCurrency(day.sales)}</td>
                          <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{formatCurrency(day.cost)}</td>
                          <td className={`px-3 py-3 text-sm whitespace-nowrap ${amountClass(day.profit)}`}>{formatCurrency(day.profit)}</td>
                          <td className="px-3 py-3 text-sm text-gray-700 whitespace-nowrap">{formatPercent(day.margin)}</td>
                          <td className="px-3 py-3 text-sm whitespace-nowrap">
                            {day.expenses > 0 ? (
                              <button type="button" onClick={() => openExpenses(day.date)} className="text-red-600 font-medium hover:underline">
                                {formatCurrency(day.expenses)}
                              </button>
                            ) : (
                              <span className="text-gray-400">{formatCurrency(0)}</span>
                            )}
                          </td>
                          <td className={`px-3 py-3 text-sm whitespace-nowrap ${amountClass(dayResult)}`}>{formatCurrency(dayResult)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Ventas del rango</h3>
                <p className="text-sm text-gray-500">Cada fila muestra cuánto se cobró, cuánto costó y qué margen dejó.</p>
              </div>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por venta, cliente o producto"
                className="w-full lg:w-80 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 w-10" />
                    {["Venta", "Fecha", "Cliente", "Cobrado", "Costo", "Ganancia", "Margen"].map((label) => (
                      <th key={label} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pageSales.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-sm text-gray-500">
                        {sales.length === 0 ? "No hay ventas completadas en este rango." : "Ninguna venta coincide con la búsqueda."}
                      </td>
                    </tr>
                  ) : (
                    pageSales.map((sale) => {
                      const isOpen = expandedSaleId === sale.id
                      return (
                        <Fragment key={sale.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={() => setExpandedSaleId(isOpen ? null : sale.id)}
                                className="p-1 rounded hover:bg-gray-100 text-gray-500"
                                aria-label={isOpen ? "Ocultar productos" : "Ver productos"}
                              >
                                {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">#{sale.id}</td>
                            <td className="px-3 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDateTime(sale.created_at)}</td>
                            <td className="px-3 py-3 text-sm text-gray-900 max-w-[12rem] truncate" title={sale.customer_name}>
                              {sale.customer_name}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">
                              {formatCurrency(sale.total)}
                              {sale.discount > 0 && (
                                <div className="text-xs text-gray-500">Desc. {formatCurrency(sale.discount)}</div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{formatCurrency(sale.cost)}</td>
                            <td className={`px-3 py-3 text-sm whitespace-nowrap ${amountClass(sale.profit)}`}>{formatCurrency(sale.profit)}</td>
                            <td className={`px-3 py-3 text-sm whitespace-nowrap ${amountClass(sale.profit)}`}>{formatPercent(sale.margin)}</td>
                          </tr>
                          {isOpen && (
                            <tr>
                              <td colSpan="8" className="px-4 py-3 bg-gray-50">
                                <SaleItems sale={sale} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })
                  )}
                </tbody>
                {filteredSales.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="4" className="px-3 py-3 text-sm font-medium text-gray-700">
                        {search.trim() ? "Totales de la búsqueda" : "Totales del rango"}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(fromCents(filteredTotals.total))}</td>
                      <td className="px-3 py-3 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCurrency(fromCents(filteredTotals.cost))}</td>
                      <td className={`px-3 py-3 text-sm whitespace-nowrap ${amountClass(fromCents(filteredTotals.profit), true)}`}>
                        {formatCurrency(fromCents(filteredTotals.profit))}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                        {formatPercent(filteredTotals.total ? Math.round((filteredTotals.profit / filteredTotals.total) * 1000) / 10 : 0)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredSales.length}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
                onItemsPerPageChange={() => {}}
                showItemsPerPage={false}
              />
            )}
            {!search.trim() && summary && (
              <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                {useSalesBase ? "Cobrado" : "Ganancia"} {formatCurrency(resultBase)} − egresos{" "}
                <button type="button" onClick={() => openExpenses(null)} className="text-red-600 font-medium hover:underline">
                  {formatCurrency(summary.expenses_total)}
                </button>{" "}
                = <span className={amountClass(result, true)}>{formatCurrency(result)}</span>
              </div>
            )}
          </div>
        </>
      )}

      <ExpensesModal
        isOpen={showExpenses}
        onClose={() => setShowExpenses(false)}
        expenses={visibleExpenses}
        total={visibleExpenseTotal}
        dayLabel={expenseDay ? formatIsoDate(expenseDay) : null}
        rangeLabel={`${formatIsoDate(startDate)} al ${formatIsoDate(endDate)}`}
      />
    </div>
  )
}

function SummaryCard({ title, value, detail, tone = "default", muted = false, active = false }) {
  const valueClass = tone === "auto" ? amountClass(value, true) : muted ? "font-semibold text-gray-700" : "font-semibold text-gray-900"
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-5 ${active ? "border-blue-400 ring-1 ring-blue-200" : "border-gray-200"}`}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`mt-2 text-2xl ${valueClass}`}>{formatCurrency(value)}</p>
      <p className="mt-1 text-xs text-gray-500">{detail}</p>
    </div>
  )
}

function SaleItems({ sale }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>Pago: {PAYMENT_LABELS[sale.payment_method] || sale.payment_method || "Sin dato"}</span>
        <span>Cajero: {sale.cashier_name}</span>
        {sale.discount > 0 && <span>Descuento repartido entre los productos: {formatCurrency(sale.discount)}</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="py-1 pr-3 font-medium">Producto</th>
              <th className="py-1 pr-3 font-medium">Cantidad</th>
              <th className="py-1 pr-3 font-medium">Precio</th>
              <th className="py-1 pr-3 font-medium">Costo unit.</th>
              <th className="py-1 pr-3 font-medium">Costo</th>
              <th className="py-1 pr-3 font-medium">Ganancia</th>
              <th className="py-1 font-medium">Margen</th>
            </tr>
          </thead>
          <tbody>
            {(sale.items || []).length === 0 ? (
              <tr>
                <td colSpan="7" className="py-2 text-sm text-gray-500">Esta venta no tiene productos cargados.</td>
              </tr>
            ) : (
              sale.items.map((item) => (
                <tr key={item.id} className="text-sm text-gray-700">
                  <td className="py-1 pr-3">
                    {item.product_name}
                    {item.missing_cost && <span className="ml-2 text-xs text-amber-700">sin costo</span>}
                  </td>
                  <td className="py-1 pr-3 whitespace-nowrap">{formatQuantity(item.quantity, item.unit_type)}</td>
                  <td className="py-1 pr-3 whitespace-nowrap">{formatCurrency(item.unit_price)}</td>
                  <td className="py-1 pr-3 whitespace-nowrap">{formatCurrency(item.unit_cost)}</td>
                  <td className="py-1 pr-3 whitespace-nowrap">{formatCurrency(item.cost)}</td>
                  <td className={`py-1 pr-3 whitespace-nowrap ${amountClass(item.profit)}`}>{formatCurrency(item.profit)}</td>
                  <td className={`py-1 whitespace-nowrap ${amountClass(item.profit)}`}>{formatPercent(item.margin)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExpensesModal({ isOpen, onClose, expenses, total, dayLabel, rangeLabel }) {
  const expenseAmount = fromCents(
    expenses.filter((expense) => expense.type === "expense").reduce((sum, expense) => sum + toCents(expense.amount), 0),
  )
  const withdrawalAmount = fromCents(
    expenses.filter((expense) => expense.type === "withdrawal").reduce((sum, expense) => sum + toCents(expense.amount), 0),
  )

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
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
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-red-100 p-2">
                      <BanknotesIcon className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">Detalle de egresos</Dialog.Title>
                      <p className="text-sm text-gray-500">{dayLabel ? `Día ${dayLabel}` : `Del ${rangeLabel}`}</p>
                    </div>
                  </div>
                  <button type="button" onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                      <p className="text-xs text-red-700">Total de egresos</p>
                      <p className="text-xl font-semibold text-red-600">{formatCurrency(total)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Gastos</p>
                      <p className="text-lg font-medium text-gray-900">{formatCurrency(expenseAmount)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Retiros</p>
                      <p className="text-lg font-medium text-gray-900">{formatCurrency(withdrawalAmount)}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[50vh]">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {["Fecha", "Tipo", "Detalle", "Usuario", "Importe"].map((label) => (
                            <th key={label} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {expenses.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-3 py-8 text-center text-sm text-gray-500">
                              No hay egresos en este período.
                            </td>
                          </tr>
                        ) : (
                          expenses.map((expense) => (
                            <tr key={expense.id}>
                              <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{formatDateTime(expense.created_at)}</td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{EXPENSE_LABELS[expense.type] || expense.type}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">
                                {expense.description || "Sin descripción"}
                                {expense.reference ? <div className="text-xs text-gray-400">{expense.reference}</div> : null}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">{expense.user_name}</td>
                              <td className="px-3 py-2 text-sm font-medium text-red-600 whitespace-nowrap">{formatCurrency(expense.amount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default ProfitsReport
