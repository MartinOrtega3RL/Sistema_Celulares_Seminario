// src/services/stockService.js
// Interfaz final — movimientos de existencias desde mocks.

import { PRODUCTOS as _prods } from '../mocks/catalogo'

// Estado mutable compartido con catalogoService (mismo array en módulo)
// En producción: todo es axios, no hay estado local.
let _movimientos = []
let _mvId = 1

function _delay(ms = 250) { return new Promise(r => setTimeout(r, ms)) }

/** GET /api/stock — existencias con indicador bajo_minimo */
export async function getStock({ categoria, marca } = {}) {
  await _delay()
  // Importamos dinámicamente para evitar circularidad y reflejar cambios de catalogoService
  const { getProductos } = await import('./catalogoService')
  const { data } = await getProductos({ limit: 9999, categoria, marca })
  return data
}

/** GET /api/stock/alertas */
export async function getAlertas() {
  await _delay(150)
  const { getProductos } = await import('./catalogoService')
  const { data } = await getProductos({ limit: 9999 })
  return data.filter(p => p.bajo_minimo || p.stock_actual <= p.stock_minimo)
}

/** POST /api/stock/ingreso */
export async function registrarIngreso({ id_producto, cantidad, motivo = 'Ingreso de mercadería', id_usuario }) {
  await _delay()
  const { updateProducto, getProductos } = await import('./catalogoService')
  const { data } = await getProductos({ limit: 9999 })
  const prod = data.find(p => p.id_producto === id_producto)
  if (!prod) throw { status: 404, message: 'Producto no encontrado.' }

  const nuevo_stock = prod.stock_actual + Number(cantidad)
  await updateProducto(id_producto, {
    ...prod,
    stock_actual: nuevo_stock,
    bajo_minimo: nuevo_stock <= prod.stock_minimo ? 1 : 0,
  })

  const mov = {
    id_movimiento:  _mvId++,
    id_producto,
    tipo_movimiento:'INGRESO',
    cantidad:       Number(cantidad),
    motivo,
    id_usuario:     id_usuario ?? null,
    id_recepcion:   null,
    id_venta:       null,
    id_orden:       null,
    fecha_movimiento: new Date().toISOString(),
    producto: { denominacion: prod.denominacion, codigo_interno: prod.codigo_interno },
  }
  _movimientos.push(mov)
  return mov
}

/** POST /api/stock/ajuste */
export async function registrarAjuste({ id_producto, cantidad, motivo, id_usuario }) {
  await _delay()
  if (!motivo) throw { status: 400, message: 'El motivo del ajuste es obligatorio.' }
  const { updateProducto, getProductos } = await import('./catalogoService')
  const { data } = await getProductos({ limit: 9999 })
  const prod = data.find(p => p.id_producto === id_producto)
  if (!prod) throw { status: 404, message: 'Producto no encontrado.' }

  const nuevo_stock = Math.max(0, prod.stock_actual + Number(cantidad))
  await updateProducto(id_producto, {
    ...prod,
    stock_actual: nuevo_stock,
    bajo_minimo: nuevo_stock <= prod.stock_minimo ? 1 : 0,
  })

  const mov = {
    id_movimiento:  _mvId++,
    id_producto,
    tipo_movimiento:'AJUSTE',
    cantidad:       Number(cantidad),
    motivo,
    id_usuario:     id_usuario ?? null,
    id_recepcion:   null,
    id_venta:       null,
    id_orden:       null,
    fecha_movimiento: new Date().toISOString(),
    producto: { denominacion: prod.denominacion, codigo_interno: prod.codigo_interno },
  }
  _movimientos.push(mov)
  return mov
}

/** GET /api/stock/movimientos — historial global filtrable */
export async function getMovimientos({ search, tipo, desde, hasta } = {}) {
  await _delay()
  let result = [..._movimientos]
  if (tipo && tipo !== 'TODOS') {
    result = result.filter(m => m.tipo_movimiento === tipo)
  }
  if (search) {
    const q = search.toLowerCase()
    result = result.filter(m =>
      m.producto?.denominacion.toLowerCase().includes(q) ||
      m.producto?.codigo_interno.toLowerCase().includes(q) ||
      m.motivo.toLowerCase().includes(q)
    )
  }
  if (desde) {
    result = result.filter(m => new Date(m.fecha_movimiento) >= new Date(desde))
  }
  if (hasta) {
    const h = new Date(hasta)
    h.setHours(23, 59, 59, 999)
    result = result.filter(m => new Date(m.fecha_movimiento) <= h)
  }
  return result.sort((a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento))
}

/** GET /api/stock/:idProducto/historial */
export async function getHistorial(idProducto) {
  await _delay()
  return _movimientos
    .filter(m => m.id_producto === idProducto)
    .sort((a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento))
}

/** Descuenta stock por venta — llamado internamente por ventasService */
export async function descontarPorVenta(detalles, id_venta, id_usuario) {
  for (const detalle of detalles) {
    const { updateProducto, getProductos } = await import('./catalogoService')
    const { data } = await getProductos({ limit: 9999 })
    const prod = data.find(p => p.id_producto === detalle.id_producto)
    if (!prod) continue
    const nuevo_stock = prod.stock_actual - detalle.cantidad
    if (nuevo_stock < 0) throw { status: 422, message: `Stock insuficiente para "${prod.denominacion}".` }
    await updateProducto(detalle.id_producto, {
      ...prod,
      stock_actual: nuevo_stock,
      bajo_minimo: nuevo_stock <= prod.stock_minimo ? 1 : 0,
    })
    _movimientos.push({
      id_movimiento:  _mvId++,
      id_producto:    detalle.id_producto,
      tipo_movimiento:'VENTA',
      cantidad:       -detalle.cantidad,
      motivo:         `Venta ${id_venta}`,
      id_usuario,
      id_venta,
      id_recepcion:   null,
      id_orden:       null,
      fecha_movimiento: new Date().toISOString(),
      producto: { denominacion: prod.denominacion, codigo_interno: prod.codigo_interno },
    })
  }
}

/** Restituye stock por anulación */
export async function restituirPorAnulacion(detalles, id_venta, id_usuario) {
  for (const detalle of detalles) {
    const { updateProducto, getProductos } = await import('./catalogoService')
    const { data } = await getProductos({ limit: 9999 })
    const prod = data.find(p => p.id_producto === detalle.id_producto)
    if (!prod) continue
    const nuevo_stock = prod.stock_actual + detalle.cantidad
    await updateProducto(detalle.id_producto, {
      ...prod,
      stock_actual: nuevo_stock,
      bajo_minimo: nuevo_stock <= prod.stock_minimo ? 1 : 0,
    })
    _movimientos.push({
      id_movimiento:  _mvId++,
      id_producto:    detalle.id_producto,
      tipo_movimiento:'RESTITUCIÓN',
      cantidad:       detalle.cantidad,
      motivo:         `Anulación venta ${id_venta}`,
      id_usuario,
      id_venta,
      id_recepcion:   null,
      id_orden:       null,
      fecha_movimiento: new Date().toISOString(),
      producto: { denominacion: prod.denominacion, codigo_interno: prod.codigo_interno },
    })
  }
}
