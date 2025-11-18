// Servicio de impresión de tickets térmicos para Argentina
import { formatCurrency, formatDate } from "@/lib/formatters"
import api from '@/config/api'

class TicketPrintService {
  constructor() {
    this.printerName = null
    this.paperWidth = 80 // 58mm o 80mm
    this.selectedPort = null
  }

  /**
   * Configura el servicio de impresión
   */
  configure(printerName, paperWidth = 80) {
    this.printerName = printerName
    this.paperWidth = paperWidth
  }

  /**
   * Solicitar selección de puerto serial (para impresoras USB)
   */
  async requestSerialPort() {
    try {
      if (!navigator.serial) {
        throw new Error('Web Serial API no soportada. Use Chrome, Edge o Brave.')
      }

      const port = await navigator.serial.requestPort()
      this.selectedPort = port
      
      return { success: true, message: 'Puerto seleccionado' }
    } catch (error) {
      console.error('[PRINT] Error seleccionando puerto:', error)
      throw error
    }
  }

  /**
   * Genera el HTML del ticket para impresión
   */
  generateTicketHTML(saleData, businessConfig, ticketConfig) {
    const { sale, items } = saleData
    
    const widthPx = this.paperWidth === 58 ? '220px' : '300px'
    
    // Determinar tamaño de fuente
    const fontSize = ticketConfig.font_size === 'small' ? '10px' : 
                     ticketConfig.font_size === 'large' ? '14px' : '12px'

    let html = ``
    // HTML generation code here
    // ...

    return html
  }

  /**
   * Imprimir ticket - MÉTODO PRINCIPAL
   */
  async printTicket(saleData, businessConfig, ticketConfig) {
    try {
      console.log('[PRINT] Solicitando ticket para venta:', saleData.sale.id)

      // 1. Obtener comandos ESC/POS del backend
      const response = await api.post('/ticket/print-escpos', { saleId: saleData.sale.id })

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      const { method, commands } = response.data.data

      // 2. Si el backend ya imprimió, terminar
      if (method === 'direct_print') {
        return { 
          success: true, 
          message: 'Ticket impreso desde el servidor' 
        }
      }

      // 3. Imprimir desde el navegador usando Web Serial API
      if (commands) {
        await this.printViaSerial(commands)
        return { 
          success: true, 
          message: 'Ticket impreso desde el navegador' 
        }
      }

      throw new Error('No se recibieron comandos de impresión')
    } catch (error) {
      console.error('[PRINT] Error:', error)
      throw error
    }
  }

  /**
   * Imprimir usando Web Serial API (para impresoras USB conectadas a la PC)
   */
  async printViaSerial(base64Commands) {
    try {
      console.log('[PRINT] Imprimiendo por Serial USB...')

      if (!navigator.serial) {
        throw new Error('Web Serial API no soportada en este navegador')
      }

      // Decodificar Base64
      const binaryString = atob(base64Commands)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      console.log('[PRINT] Bytes a enviar:', bytes.length)

      // Si no hay puerto seleccionado, solicitar uno
      if (!this.selectedPort) {
        this.selectedPort = await navigator.serial.requestPort()
      }

      // Abrir puerto
      if (!this.selectedPort.readable) {
        await this.selectedPort.open({
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none'
        })
      }

      // Enviar datos
      const writer = this.selectedPort.writable.getWriter()
      await writer.write(bytes)
      writer.releaseLock()

      console.log('[PRINT] Datos enviados correctamente')

      // Esperar y cerrar
      await new Promise(resolve => setTimeout(resolve, 1000))
      await this.selectedPort.close()
      this.selectedPort = null

      return { success: true }
    } catch (error) {
      console.error('[PRINT] Error en Serial:', error)
      throw error
    }
  }

  /**
   * Vista previa del ticket
   */
  async previewTicket(saleData, businessConfig, ticketConfig) {
    try {
      const response = await api.post('/ticket/print-escpos', { saleId: saleData.sale.id })

      if (!response.data.success || !response.data.data.commands) {
        throw new Error('No se pudo generar la vista previa')
      }

      const binaryString = atob(response.data.data.commands)
      let text = ''
      
      for (let i = 0; i < binaryString.length; i++) {
        const code = binaryString.charCodeAt(i)
        if (code >= 32 && code <= 126) text += binaryString.charAt(i)
        else if (code === 10) text += '\n'
      }

      const previewWindow = window.open('', 'TicketPreview', 'width=400,height=700')
      
      if (!previewWindow) {
        throw new Error('Habilite ventanas emergentes para ver la vista previa')
      }

      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Vista Previa - Ticket #${saleData.sale.id}</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: 'Courier New', monospace;
              background: #667eea;
              padding: 20px;
            }
            .ticket { 
              background: white;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
              border: 2px solid #333;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }
            pre { 
              font-size: 11px;
              white-space: pre-wrap;
              line-height: 1.4;
              margin: 0;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 10px;
              margin-top: 15px;
              font-size: 11px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <pre>${text}</pre>
            <div class="warning">
              ⚠️ VISTA PREVIA<br>
              Configure su impresora para imprimir
            </div>
          </div>
        </body>
        </html>
      `)
      
      previewWindow.document.close()
      return { success: true }
    } catch (error) {
      console.error('[PRINT] Error en preview:', error)
      throw error
    }
  }

  /**
   * Descarga el ticket como HTML
   */
  downloadTicket(saleData, businessConfig, ticketConfig) {
    try {
      const html = this.generateTicketHTML(saleData, businessConfig, ticketConfig)
      
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ticket-${saleData.sale.id}-${Date.now()}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (error) {
      console.error('Error al descargar ticket:', error)
      return { 
        success: false, 
        error: error.message || 'Error al descargar el ticket'
      }
    }
  }

  /**
   * Obtiene la etiqueta legible del método de pago
   */
  getPaymentMethodLabel(method) {
    const labels = {
      efectivo: 'Efectivo',
      tarjeta_credito: 'Tarjeta de Crédito',
      tarjeta_debito: 'Tarjeta de Débito',
      transferencia: 'Transferencia',
      cuenta_corriente: 'Cuenta Corriente',
      multiple: 'Múltiples'
    }
    return labels[method] || method
  }
}

// Exportar instancia única
const ticketPrintService = new TicketPrintService()
export default ticketPrintService
