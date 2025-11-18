import { useState, useEffect } from 'react'
import { useToast } from '@/contexts/ToastContext'
import Button from '@/components/common/Button'
import LoadingButton from '@/components/common/LoadingButton'
import { PrinterIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import api from '@/config/api'

export default function PrinterConfigModal({ isOpen, onClose, onPrinterSelected }) {
  const { showToast } = useToast()
  const [printers, setPrinters] = useState([])
  const [selectedPrinter, setSelectedPrinter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detectingPrinters, setDetectingPrinters] = useState(false)
  const [printerStatus, setPrinterStatus] = useState(null)
  const [step, setStep] = useState('detect')

  useEffect(() => {
    if (isOpen) {
      checkPrinterStatus()
    }
  }, [isOpen])

  const checkPrinterStatus = async () => {
    try {
      const response = await api.get('/ticket/printers/status')
      if (response.data.success) {
        setPrinterStatus(response.data.data)
        if (response.data.data.connected) {
          setStep('test')
        }
      }
    } catch (error) {
      console.error('[v0] Error checking printer status:', error)
    }
  }

  const detectPrinters = async () => {
    setDetectingPrinters(true)
    try {
      const response = await api.get('/ticket/printers/detect')
      if (response.data.success) {
        setPrinters(response.data.data || [])
        if (response.data.data.length === 0) {
          showToast('No se encontraron impresoras. Verifique que estén encendidas y conectadas.', 'warning')
        } else {
          showToast(`${response.data.data.length} impresora(s) encontrada(s)`, 'success')
          setStep('select')
        }
      }
    } catch (error) {
      console.error('[v0] Error detecting printers:', error)
      showToast('Error al detectar impresoras', 'error')
    } finally {
      setDetectingPrinters(false)
    }
  }

  const connectPrinter = async (printer) => {
    setLoading(true)
    try {
      const response = await api.post('/ticket/printers/connect', {
        printerName: printer.name
      })
      
      if (response.data.success) {
        setSelectedPrinter(printer)
        setPrinterStatus({
          connected: true,
          printerName: printer.name,
          type: printer.type
        })
        showToast(`Impresora conectada: ${printer.name}`, 'success')
        setStep('test')
        
        if (onPrinterSelected) {
          onPrinterSelected(printer)
        }
      }
    } catch (error) {
      console.error('[v0] Error connecting printer:', error)
      showToast(error.response?.data?.message || 'Error al conectar impresora', 'error')
    } finally {
      setLoading(false)
    }
  }

  const testPrint = async () => {
    setLoading(true)
    try {
      const response = await api.post('/ticket/printers/test')
      if (response.data.success) {
        showToast('Ticket de prueba impreso correctamente', 'success')
        onClose()
      }
    } catch (error) {
      console.error('[v0] Error testing printer:', error)
      showToast(error.response?.data?.message || 'Error al imprimir prueba', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <PrinterIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Configurar Impresora</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 'detect' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Haga clic en "Detectar impresoras" para buscar todas las impresoras instaladas en Windows.
              </p>
              
              {printerStatus?.connected && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Impresora conectada</p>
                    <p className="text-green-700 text-xs">{printerStatus.printerName}</p>
                  </div>
                </div>
              )}

              <LoadingButton
                onClick={detectPrinters}
                loading={detectingPrinters}
                className="w-full"
              >
                Detectar Impresoras
              </LoadingButton>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  📌 Instrucciones:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Encienda su impresora</li>
                  <li>Verifique que esté instalada en Windows</li>
                  <li>Haga clic en "Detectar impresoras"</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'select' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Seleccione su impresora de la lista:
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {printers.map((printer, index) => (
                  <button
                    key={index}
                    onClick={() => connectPrinter(printer)}
                    disabled={loading}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      selectedPrinter?.name === printer.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-gray-900">
                            {printer.name}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {printer.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{printer.manufacturer}</p>
                      </div>
                      {loading && selectedPrinter?.name === printer.name && (
                        <div className="animate-spin">
                          <PrinterIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {printers.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    No se encontraron impresoras. Instale la impresora en Windows primero.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setStep('detect')}
                  variant="outline"
                  className="flex-1"
                >
                  Volver
                </Button>
              </div>
            </div>
          )}

          {step === 'test' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="text-sm flex-1">
                  <p className="font-medium text-green-900">Impresora conectada</p>
                  <p className="text-green-700 text-xs">
                    {selectedPrinter?.name || printerStatus?.printerName}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Presione el botón para realizar una prueba de impresión:
              </p>

              <LoadingButton
                onClick={testPrint}
                loading={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Imprimir Prueba
              </LoadingButton>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setStep('detect')
                    setSelectedPrinter(null)
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Cambiar Impresora
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
