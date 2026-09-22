import { api, consulta } from '../../api/cliente.js'

// --- Ya implementado en el backend. ----------------------------------------

export const confirmarVenta = (orden) => api.enviar('/ventas', orden)

export const buscarVenta = (idVenta) => api.obtener(`/ventas/${idVenta}`)

export const listarMediosPago = () => api.obtener('/ventas/medios-pago')

/** El comprobante lo emite el backend a traves de su interfaz (S05). */
export const urlComprobante = (idVenta) => `/api/ventas/${idVenta}/comprobante`

// --- Pendiente en el backend. ----------------------------------------------

/** RF18.1 — historial con filtros por periodo y por cliente. */
export const listarVentas = ({ desde, hasta, idCliente, estado, pagina = 1, tamano = 25 } = {}) =>
  api.obtener(`/ventas${consulta({ desde, hasta, idCliente, estado, pagina, tamano })}`)

/**
 * RF18.2 — anulacion. Restituye las existencias (RF11.4) y deja registrado el
 * responsable y el motivo. No borra la venta: la marca como anulada.
 */
export const anularVenta = (idVenta, motivo) => api.enviar(`/ventas/${idVenta}/anular`, { motivo })
