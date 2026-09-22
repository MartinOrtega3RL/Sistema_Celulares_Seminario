// ANDAMIO TEMPORAL — se borra cuando el backend este completo.
//
// Varias pantallas de la iteracion 1 llaman a endpoints que todavia no existen.
// Sin esto, cada una moriria en un 404 y no se podria evaluar la interaccion.
//
// Reglas que lo hacen seguro:
//   1. Actua UNICAMENTE ante RUTA_NO_ENCONTRADA. Un 500, un 422 o un 403 del
//      backend real pasan derecho: nunca tapa un error de verdad.
//   2. Solo en desarrollo. En una compilacion de produccion no se incluye.
//   3. Avisa por consola cada vez que responde, para que nadie confunda esto
//      con datos reales.
//
// Cuando el backend implemente una ruta, esta capa deja de verla sin que haya
// que tocar una linea de las pantallas.

const RUTAS_PENDIENTES = `
  GET    /api/usuarios                 RF02.5
  POST   /api/usuarios                 RF02.1
  PUT    /api/usuarios/:id             RF02.2 RF02.4
  DELETE /api/usuarios/:id             RF02.3
  GET    /api/usuarios/perfiles        RF02.4
  POST   /api/catalogo                 RF06.1 RF08.1 RF08.2 RF08.3 RF09.1
  PUT    /api/catalogo/:id             RF06.2 RF08
  DELETE /api/catalogo/:id             RF06.3
  GET    /api/catalogo/:id/etiqueta    RF09.2
  POST   /api/catalogo/precios         RF08.4
  GET    /api/categorias               RF07.1
  POST   /api/categorias               RF07.1
  GET    /api/marcas                   RF07.2
  POST   /api/marcas                   RF07.2
  GET    /api/existencias/movimientos  RF12.4
  POST   /api/existencias/ingreso      RF11.1
  POST   /api/existencias/ajuste       RF11.5
  GET    /api/ventas                   RF18.1
  POST   /api/ventas/:id/anular        RF18.2
`

let avisado = false

const avisarUnaVez = () => {
  if (avisado) return
  avisado = true
  console.warn(
    `%cDATOS DE PLANTILLA%c Hay pantallas respondiendo con datos de andamio porque su endpoint todavia no existe.\nRutas pendientes en el backend:\n${RUTAS_PENDIENTES}`,
    'background:#E4322B;color:#F5F1E6;padding:2px 6px;font-weight:700',
    '',
  )
}

// ---------------------------------------------------------------- fixtures
const paginar = (filas, consulta) => {
  const pagina = Number(consulta.get('pagina') ?? 1)
  const tamano = Number(consulta.get('tamano') ?? 25)
  const desde = (pagina - 1) * tamano

  return {
    datos: filas.slice(desde, desde + tamano),
    paginacion: {
      pagina,
      tamano,
      total: filas.length,
      totalPaginas: Math.max(1, Math.ceil(filas.length / tamano)),
    },
  }
}

const PERFILES = [
  { idPerfil: 1, nombre: 'Administrador', descripcion: 'Acceso total. Unico perfil habilitado para reportes y precios de costo' },
  { idPerfil: 2, nombre: 'Vendedor', descripcion: 'Ventas, clientes y consulta del catalogo' },
  { idPerfil: 3, nombre: 'Tecnico', descripcion: 'Servicio tecnico, clientes y consulta del catalogo' },
]

const USUARIOS = [
  { idUsuario: 1, nombreUsuario: 'marto', activo: true, idPerfil: 1, perfil: PERFILES[0], persona: { apellidoNombre: 'Ortega Martin', telefonoWhatsapp: null } },
  { idUsuario: 2, nombreUsuario: 'colaboradora', activo: true, idPerfil: 2, perfil: PERFILES[1], persona: { apellidoNombre: 'Colaboradora de mostrador', telefonoWhatsapp: null } },
  { idUsuario: 3, nombreUsuario: 'tecnico', activo: true, idPerfil: 3, perfil: PERFILES[2], persona: { apellidoNombre: 'Tecnico del taller', telefonoWhatsapp: null } },
]

const MOVIMIENTOS = [
  { idMovimiento: 4, fechaHora: '2026-09-15T18:20:00', tipoMovimiento: 'VENTA', cantidad: -2, stockResultante: 22, motivo: null, usuario: { nombreUsuario: 'marto' }, producto: { denominacion: 'Funda silicona lisa Apple', codigoInterno: 'DEMO-0001' } },
  { idMovimiento: 3, fechaHora: '2026-09-15T11:05:00', tipoMovimiento: 'INGRESO', cantidad: 12, stockResultante: 24, motivo: null, usuario: { nombreUsuario: 'marto' }, producto: { denominacion: 'Funda silicona lisa Apple', codigoInterno: 'DEMO-0001' } },
  { idMovimiento: 2, fechaHora: '2026-09-14T16:40:00', tipoMovimiento: 'AJUSTE', cantidad: -1, stockResultante: 12, motivo: 'Rotura en el mostrador', usuario: { nombreUsuario: 'marto' }, producto: { denominacion: 'Vidrio templado 9H Apple', codigoInterno: 'DEMO-0004' } },
  { idMovimiento: 1, fechaHora: '2026-09-14T09:15:00', tipoMovimiento: 'INGRESO', cantidad: 13, stockResultante: 13, motivo: null, usuario: { nombreUsuario: 'marto' }, producto: { denominacion: 'Vidrio templado 9H Apple', codigoInterno: 'DEMO-0004' } },
]

const VENTAS = [
  { idVenta: 3, numeroComprobante: '0001-00000003', fechaHora: '2026-09-15T18:20:00', montoTotal: '24000.00', recargoFinanciacion: '0.00', estado: 'CONFIRMADA', listaPrecioAplicada: 'MINORISTA', modalidadPago: 'CONTADO', cliente: null, vendedor: { nombreUsuario: 'marto' }, pago: { medioPago: { nombre: 'Efectivo' } } },
  { idVenta: 2, numeroComprobante: '0001-00000002', fechaHora: '2026-09-15T12:02:00', montoTotal: '86800.00', recargoFinanciacion: '0.00', estado: 'CONFIRMADA', listaPrecioAplicada: 'MAYORISTA', modalidadPago: 'TARJETA_CUOTAS', cantidadCuotas: 6, cliente: { persona: { apellidoNombre: 'Distribuidora del Norte' } }, vendedor: { nombreUsuario: 'marto' }, pago: { medioPago: { nombre: 'Mercado Pago' } } },
  { idVenta: 1, numeroComprobante: '0001-00000001', fechaHora: '2026-09-14T10:30:00', montoTotal: '15500.00', recargoFinanciacion: '0.00', estado: 'ANULADA', listaPrecioAplicada: 'MINORISTA', modalidadPago: 'CONTADO', motivoAnulacion: 'El cliente se arrepintio en el momento', cliente: null, vendedor: { nombreUsuario: 'marto' }, pago: { medioPago: { nombre: 'Efectivo' } } },
]

// ------------------------------------------------------------- resolucion
const RESPUESTAS = [
  [/^GET \/usuarios\/perfiles$/, () => ({ datos: PERFILES })],
  [/^GET \/usuarios/, (_, consulta) => paginar(USUARIOS, consulta)],
  [/^(POST|PUT) \/usuarios/, (_, __, cuerpo) => ({ datos: { idUsuario: 99, ...cuerpo } })],
  [/^DELETE \/usuarios/, () => null],

  [/^GET \/categorias/, () => ({ datos: ['Telefonos', 'Accesorios', 'Repuestos', 'Fundas', 'Vidrios templados', 'Cargadores', 'Auriculares'].map((nombre, i) => ({ idCategoria: i + 1, nombre, activo: true })) })],
  [/^GET \/marcas/, () => ({ datos: ['Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Genericos'].map((nombre, i) => ({ idMarca: i + 1, nombre, activo: true })) })],
  [/^(POST|PUT) \/(categorias|marcas)/, (_, __, cuerpo) => ({ datos: { idCategoria: 99, idMarca: 99, ...cuerpo } })],
  [/^DELETE \/(categorias|marcas)/, () => null],

  [/^(POST|PUT) \/catalogo/, (_, __, cuerpo) => ({ datos: { idProducto: 99, codigoInterno: 'EGC-0099', ...cuerpo } })],
  [/^DELETE \/catalogo/, () => null],

  [/^GET \/existencias\/movimientos/, (_, consulta) => paginar(MOVIMIENTOS, consulta)],
  [/^POST \/existencias/, () => ({ datos: { registrado: true } })],

  [/^GET \/ventas(\?|$)/, (_, consulta) => paginar(VENTAS, consulta)],
  [/^POST \/ventas\/\d+\/anular$/, () => ({ datos: { estado: 'ANULADA' } })],
]

/**
 * Devuelve la respuesta de andamio para una ruta pendiente, o el simbolo
 * SIN_PLANTILLA cuando no hay ninguna: en ese caso el 404 real sube tal cual.
 */
export const SIN_PLANTILLA = Symbol('sin plantilla')

export const responderPlantilla = (metodo, ruta, cuerpo) => {
  if (!import.meta.env.DEV) return SIN_PLANTILLA

  const [camino, consulta = ''] = ruta.split('?')
  const clave = `${metodo} ${camino}`
  const parametros = new URLSearchParams(consulta)

  for (const [patron, resolver] of RESPUESTAS) {
    if (patron.test(clave)) {
      avisarUnaVez()
      console.warn(`[plantilla] ${clave}`)
      return resolver(clave, parametros, cuerpo)
    }
  }

  return SIN_PLANTILLA
}
