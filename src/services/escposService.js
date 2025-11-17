/**
 * Servicio de impresión ESC/POS para el frontend
 * Se comunica con el backend para obtener los comandos ESC/POS
 */

import api from '@/config/api'

class EscposFrontendService {
  /**
   * Genera comandos ESC/POS en el backend y los retorna
   */
  async generateEscposCommands(saleId, businessConfig, ticketConfig) {
    try {
      const response = await api.post('/config/print-escpos', {
        saleId,
        businessConfig,
        ticketConfig
      })

      if (response.data.success) {
        return response.data.data.commands
      }
      throw new Error(response.data.message)
    } catch (error) {
      console.error('Error generando ESC/POS:', error)
      throw error
    }
  }

  /**
   * Imprime directamente usando Web Bluetooth (para impresoras Bluetooth)
   */
  async printViaBluetooth(escposBase64) {
    try {
      const binaryString = atob(escposBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }]
      })

      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
      const characteristic = await service.getCharacteristic('00002a19-0000-1000-8000-00805f9b34fb')

      await characteristic.writeValue(bytes)
      return { success: true, message: 'Enviado a impresora Bluetooth' }
    } catch (error) {
      console.error('Error imprimiendo vía Bluetooth:', error)
      throw error
    }
  }

  /**
   * Imprime usando Puerto Serial (para impresoras USB/Serial)
   */
  async printViaSerialPort(escposBase64) {
    try {
      const binaryString = atob(escposBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const port = await navigator.serial.requestPort()
      await port.open({ baudRate: 9600 })

      const writer = port.writable.getWriter()
      await writer.write(bytes)
      writer.releaseLock()

      await port.close()
      return { success: true, message: 'Enviado a impresora Serial' }
    } catch (error) {
      console.error('Error imprimiendo vía Serial:', error)
      throw error
    }
  }

  /**
   * Imprime usando servidor local
   */
  async printViaLocalServer(escposBase64, localServerUrl = 'http://localhost:9100') {
    try {
      const response = await fetch(localServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: escposBase64
        })
      })

      if (response.ok) {
        return { success: true, message: 'Enviado a impresora local' }
      }
      throw new Error('Error en respuesta del servidor local')
    } catch (error) {
      console.error('Error imprimiendo vía servidor local:', error)
      throw error
    }
  }

  /**
   * Imprime usando vista previa (fallback)
   */
  async printViaPreview(escposBase64) {
    try {
      const binaryString = atob(escposBase64)
      
      const previewWindow = window.open('', 'THERMAL_PREVIEW', 'width=400,height=600')
      previewWindow.document.write(`
        <html>
        <head>
          <title>Vista Previa Ticket Térmico</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 20px; background: #f5f5f5; }
            .ticket { width: 280px; border: 1px solid #ccc; padding: 10px; background: white; margin: auto; }
            pre { font-size: 11px; white-space: pre-wrap; margin: 0; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <pre>${this.escposToText(binaryString)}</pre>
          </div>
        </body>
        </html>
      `)
      previewWindow.document.close()

      return { success: true, message: 'Abierta vista previa' }
    } catch (error) {
      console.error('Error en vista previa:', error)
      throw error
    }
  }

  /**
   * Convierte comandos ESC/POS a texto legible
   */
  escposToText(binaryString) {
    let text = ''
    for (let i = 0; i < binaryString.length; i++) {
      const charCode = binaryString.charCodeAt(i)
      if (charCode >= 32 && charCode <= 126) {
        text += binaryString.charAt(i)
      } else if (charCode === 10) {
        text += '\n'
      } else if (charCode === 27) {
        text += '[ESC]'
      } else if (charCode === 29) {
        text += '[GS]'
      }
    }
    return text
  }
}

export default new EscposFrontendService()
