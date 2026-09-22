import { randomUUID } from 'node:crypto'
import { sequelize } from '../../config/base-de-datos.js'
import { Venta, DetalleVenta, PagoVenta, Producto, Cliente, TipoCliente, Persona, MedioPago, Usuario } from '../../modelos/index.js'
import { descontarPorVenta } from '../existencias/existencias.servicio.js'
import { NoEncontrado, DatosInvalidos } from '../../errores.js'
import {
  resolverLista, precioSegunLista, calcularTotal, aPesos,
  cuotasCoherentes, entregaCoherente, formatearComprobante,
} from './ventas.reglas.js'

const buscarCliente = async (idCliente, transaction) => {
  if (!idCliente) return null

  const cliente = await Cliente.findByPk(idCliente, {
    include: [
      { model: TipoCliente, as: 'tipoCliente' },
      { model: Persona, as: 'persona', attributes: ['apellidoNombre', 'numeroDocumento'] },
    ],
    transaction,
  })
  if (!cliente || !cliente.activo) throw new NoEncontrado('El cliente')
  return cliente
}

// Congela precio y costo al momento de la operacion: un cambio de precio
// posterior no altera una venta ya registrada.
const armarLineas = async (items, lista, transaction) => Promise.all(
  items.map(async ({ idProducto, cantidad }) => {
    const producto = await Producto.findByPk(idProducto, { transaction })
    if (!producto || !producto.activo) throw new NoEncontrado(`El producto ${idProducto}`)

    return {
      idProducto,
      cantidad,
      precioUnitario: precioSegunLista(producto, lista),
      costoUnitario: producto.precioCosto,
      denominacion: producto.denominacion,
    }
  }),
)

const verificarCoherencia = (datos) => {
  if (!cuotasCoherentes(datos)) {
    throw new DatosInvalidos('Una venta al contado no lleva cuotas, y una financiada necesita al menos una.')
  }
  if (!entregaCoherente(datos)) {
    throw new DatosInvalidos('El envio a domicilio necesita que informes la direccion de entrega.')
  }
}

const registrarPago = async ({ idVenta, idMedioPago, importe, referencia }, transaction) => {
  const medio = await MedioPago.findByPk(idMedioPago, { transaction })
  if (!medio || !medio.activo) throw new NoEncontrado('El medio de pago')

  return PagoVenta.create({ idVenta, idMedioPago, importe, referencia }, { transaction })
}

/**
 * RF16.7 — confirma la venta. Todo ocurre dentro de una unica transaccion:
 * la venta, sus lineas, el descuento de existencias y el pago se registran
 * juntos o no se registra ninguno (RNF14).
 *
 * @param {object} orden datos validados de la operacion
 * @param {number} idUsuario responsable, tomado del token y nunca del cuerpo
 */
export const confirmarVenta = async (orden, idUsuario) => {
  verificarCoherencia(orden)

  const { idCliente, lineas: items, modalidadPago, cantidadCuotas, recargoFinanciacion = 0,
    modalidadEntrega, domicilioEntrega, idMedioPago, referenciaPago } = orden

  return sequelize.transaction(async (transaction) => {
    const cliente = await buscarCliente(idCliente, transaction)
    const lista = resolverLista(cliente)
    const lineas = await armarLineas(items, lista, transaction)
    const total = aPesos(calcularTotal(lineas))

    // Provisorio unico: el numero definitivo se deriva del identificador que
    // asigna la base, que no puede colisionar. Las dos escrituras van en la
    // misma transaccion, asi que nadie ve nunca el provisorio.
    const venta = await Venta.create({
      idCliente: idCliente ?? null,
      idUsuario,
      numeroComprobante: `TMP-${randomUUID().slice(0, 16)}`,
      listaPrecioAplicada: lista,
      montoTotal: total,
      modalidadPago,
      cantidadCuotas: cantidadCuotas ?? null,
      recargoFinanciacion,
      modalidadEntrega,
      domicilioEntrega: domicilioEntrega ?? null,
      estado: 'CONFIRMADA',
    }, { transaction })

    await venta.update({ numeroComprobante: formatearComprobante(venta.idVenta) }, { transaction })

    for (const linea of lineas) {
      // Existencias es duena de la guarda: si no alcanza, lanza y todo se revierte.
      await descontarPorVenta({
        idProducto: linea.idProducto,
        cantidad: linea.cantidad,
        idUsuario,
        idVenta: venta.idVenta,
      }, transaction)

      await DetalleVenta.create({
        idVenta: venta.idVenta,
        idProducto: linea.idProducto,
        cantidad: linea.cantidad,
        precioUnitario: linea.precioUnitario,
        costoUnitario: linea.costoUnitario,
      }, { transaction })
    }

    await registrarPago({
      idVenta: venta.idVenta,
      idMedioPago,
      importe: aPesos(calcularTotal(lineas) + Math.round(Number(recargoFinanciacion) * 100)),
      referencia: referenciaPago ?? null,
    }, transaction)

    return { venta, lineas, cliente }
  })
}

/** RF16.6 — medios de pago habilitados. Vienen precargados (H17). */
export const listarMediosPago = async () => MedioPago.findAll({
  where: { activo: true },
  attributes: ['idMedioPago', 'nombre'],
  order: [['idMedioPago', 'ASC']],
})

/** Consulta de una venta con todo su agregado, para el comprobante y RF18.1. */
export const buscarVenta = async (idVenta) => {
  const venta = await Venta.findByPk(idVenta, {
    include: [
      { model: DetalleVenta, as: 'detalle', include: [{ model: Producto, as: 'producto', attributes: ['denominacion', 'codigoInterno'] }] },
      { model: PagoVenta, as: 'pago', include: [{ model: MedioPago, as: 'medioPago' }] },
      { model: Cliente, as: 'cliente', include: [{ model: Persona, as: 'persona' }] },
      // El comprobante consigna quien atendio (RF16.7 / RNF18).
      { model: Usuario, as: 'vendedor', attributes: ['idUsuario', 'nombreUsuario'] },
    ],
  })
  if (!venta) throw new NoEncontrado('La venta')
  return venta
}
