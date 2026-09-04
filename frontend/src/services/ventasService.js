// src/services/ventasService.js
// Interfaz final — registro transaccional de ventas desde mocks.

import { VENTAS as _base, MEDIOS_PAGO, nextNumeroComprobante } from '../mocks/ventas'
import { descontarPorVenta, restituirPorAnulacion } from './stockService'

let _ventas = structuredClone(_base)
let _nextId = _ventas.length + 1

function _delay(ms = 350) { return new Promise(r => setTimeout(r, ms)) }

/** GET /api/medios-pago */
export async function getMediosPago() {
  await _delay(100)
  return MEDIOS_PAGO
}

/** GET /api/ventas */
export async function getVentas({ page = 1, limit = 20, desde, hasta, id_cliente } = {}) {
  await _delay()
  let lista = [..._ventas]
  if (desde) lista = lista.filter(v => new Date(v.fecha_venta) >= new Date(desde))
  if (hasta) lista = lista.filter(v => new Date(v.fecha_venta) <= new Date(hasta))
  if (id_cliente) lista = lista.filter(v => v.id_cliente === Number(id_cliente))
  lista.sort((a, b) => new Date(b.fecha_venta) - new Date(a.fecha_venta))
  const total = lista.length
  const data  = lista.slice((page - 1) * limit, page * limit)
  return { data, total }
}

/** GET /api/ventas/:id */
export async function getVenta(id) {
  await _delay()
  const v = _ventas.find(v => v.id_venta === id)
  if (!v) throw { status: 404, message: 'Venta no encontrada.' }
  return v
}

/**
 * POST /api/ventas — transacción crítica (RF16.7)
 * @param {object} payload
 * @param {object[]} payload.detalles       — [{ id_producto, cantidad, precio_unitario, costo_unitario, producto }]
 * @param {number}   payload.id_cliente
 * @param {number}   payload.id_usuario
 * @param {number}   payload.id_medio_pago
 * @param {string}   payload.modalidad_pago — CONTADO | FINANCIACION_PROPIA | TARJETA_CUOTAS | GO_CUOTAS
 * @param {number}   [payload.cantidad_cuotas]
 * @param {number}   [payload.recargo_financiacion]
 * @param {string}   payload.modalidad_entrega — RETIRO_LOCAL | ENVIO_DOMICILIO
 * @param {string}   payload.lista_precio_aplicada — minorista | mayorista
 */
export async function registrarVenta(payload) {
  await _delay()

  const {
    detalles,
    id_cliente,
    id_usuario,
    id_medio_pago,
    modalidad_pago,
    cantidad_cuotas = null,
    recargo_financiacion = null,
    modalidad_entrega,
    lista_precio_aplicada,
    cliente,
    usuario,
  } = payload

  if (!detalles?.length) throw { status: 400, message: 'La venta no tiene productos.' }

  // Bloqueo optimista simulado + descuento de stock
  await descontarPorVenta(detalles, _nextId, id_usuario)

  const total = detalles.reduce((s, d) => s + d.precio_unitario * d.cantidad, 0)
  const medio = MEDIOS_PAGO.find(m => m.id_medio_pago === id_medio_pago)

  const venta = {
    id_venta:              _nextId++,
    id_cliente,
    id_usuario,
    numero_comprobante:    nextNumeroComprobante(),
    fecha_venta:           new Date().toISOString(),
    lista_precio_aplicada,
    modalidad_pago,
    cantidad_cuotas,
    recargo_financiacion,
    modalidad_entrega,
    estado:                'CONFIRMADA',
    id_usuario_anulacion:  null,
    motivo_anulacion:      null,
    fecha_anulacion:       null,
    cliente:               cliente ?? null,
    usuario:               usuario ?? null,
    detalles:              detalles.map((d, i) => ({ id_detalle_venta: i + 1, id_venta: _nextId - 1, ...d })),
    pago: { id_pago: _nextId, id_venta: _nextId - 1, id_medio_pago, monto: total, medio_pago: medio },
    total,
  }

  _ventas.push(venta)
  return venta
}

/** PUT /api/ventas/:id/anular */
export async function anularVenta(id, { motivo, id_usuario }) {
  await _delay()
  const v = _ventas.find(v => v.id_venta === id)
  if (!v) throw { status: 404, message: 'Venta no encontrada.' }
  if (v.estado === 'ANULADA') throw { status: 422, message: 'La venta ya está anulada.' }

  await restituirPorAnulacion(v.detalles, id, id_usuario)

  v.estado              = 'ANULADA'
  v.id_usuario_anulacion = id_usuario
  v.motivo_anulacion    = motivo
  v.fecha_anulacion     = new Date().toISOString()
  return v
}
