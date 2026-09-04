// src/mocks/ventas.js
// Forma exacta de: tabla `venta`, `detalle_venta`, `pago_venta`, `medio_pago`

export const MEDIOS_PAGO = [
  { id_medio_pago: 1, nombre_medio: 'Efectivo' },
  { id_medio_pago: 2, nombre_medio: 'Mercado Pago — Transferencia' },
  { id_medio_pago: 3, nombre_medio: 'Mercado Pago — QR' },
  { id_medio_pago: 4, nombre_medio: 'Mercado Pago — Tarjeta (Point Smart)' },
]

export const VENTAS = [
  {
    id_venta:              1,
    id_cliente:            1,
    id_usuario:            2,
    numero_comprobante:    'VTA-00001',
    fecha_venta:           '2026-09-01T10:23:00',
    lista_precio_aplicada: 'minorista',
    modalidad_pago:        'CONTADO',
    cantidad_cuotas:       null,
    recargo_financiacion:  null,
    modalidad_entrega:     'RETIRO_LOCAL',
    estado:                'CONFIRMADA',
    id_usuario_anulacion:  null,
    motivo_anulacion:      null,
    fecha_anulacion:       null,
    cliente: { id_cliente: 1, persona: { nombre: 'Diego', apellido: 'Fernández' } },
    usuario: { id_usuario: 2, nombre_usuario: 'laura.vendedora' },
    detalles: [
      {
        id_detalle_venta: 1,
        id_venta:         1,
        id_producto:      1,
        cantidad:         1,
        precio_unitario:  7500,
        costo_unitario:   3200,
        producto:         { denominacion: 'Funda silicona iPhone 15 Pro', codigo_interno: 'GC-0001' },
      },
      {
        id_detalle_venta: 2,
        id_venta:         1,
        id_producto:      2,
        cantidad:         2,
        precio_unitario:  3500,
        costo_unitario:   1200,
        producto:         { denominacion: 'Cable USB-C 1m trenzado', codigo_interno: 'GC-0002' },
      },
    ],
    pago: { id_pago: 1, id_venta: 1, id_medio_pago: 1, monto: 14500, medio_pago: MEDIOS_PAGO[0] },
    total: 14500,
  },
  {
    id_venta:              2,
    id_cliente:            2,
    id_usuario:            1,
    numero_comprobante:    'VTA-00002',
    fecha_venta:           '2026-09-02T15:45:00',
    lista_precio_aplicada: 'mayorista',
    modalidad_pago:        'FINANCIACION_PROPIA',
    cantidad_cuotas:       3,
    recargo_financiacion:  12.5,
    modalidad_entrega:     'ENVIO_DOMICILIO',
    estado:                'CONFIRMADA',
    id_usuario_anulacion:  null,
    motivo_anulacion:      null,
    fecha_anulacion:       null,
    cliente: { id_cliente: 2, persona: { nombre: 'Accesorios', apellido: 'del Norte S.R.L.' } },
    usuario: { id_usuario: 1, nombre_usuario: 'martin.admin' },
    detalles: [
      {
        id_detalle_venta: 3,
        id_venta:         2,
        id_producto:      3,
        cantidad:         5,
        precio_unitario:  19000,
        costo_unitario:   9500,
        producto:         { denominacion: 'Auriculares in-ear Xiaomi Redmi Buds 4', codigo_interno: 'GC-0003' },
      },
    ],
    pago: { id_pago: 2, id_venta: 2, id_medio_pago: 2, monto: 95000, medio_pago: MEDIOS_PAGO[1] },
    total: 95000,
  },
]

// Contador para generar números de comprobante en mocks
let _ventaCounter = VENTAS.length

export function nextNumeroComprobante() {
  _ventaCounter += 1
  return `VTA-${String(_ventaCounter).padStart(5, '0')}`
}
