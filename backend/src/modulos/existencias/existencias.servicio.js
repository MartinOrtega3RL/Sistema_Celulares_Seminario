import { sequelize } from '../../config/base-de-datos.js'
import { Producto, MovimientoStock } from '../../modelos/index.js'
import { StockInsuficiente, NoEncontrado } from '../../errores.js'

// Existencias es duena de la regla "el saldo no puede quedar negativo".
// Ventas pide descontar; no escribe producto.stock_actual por su cuenta.

// InnoDB opera en REPEATABLE READ: leer el saldo y despues restarlo deja una
// ventana en la que dos ventas simultaneas de la ultima unidad pasan las dos.
// La guarda va DENTRO de la sentencia, sin lectura previa. Si afecta 0 filas,
// no habia existencias y la transaccion completa se revierte (RNF05, RNF14).
const SQL_DESCONTAR = `
  UPDATE producto
     SET stock_actual = stock_actual - :cantidad
   WHERE id_producto = :idProducto
     AND activo = 1
     AND stock_actual >= :cantidad
`

const SQL_RESTITUIR = `
  UPDATE producto
     SET stock_actual = stock_actual + :cantidad
   WHERE id_producto = :idProducto
`

const filasAfectadas = (resultado) => resultado?.[0]?.affectedRows ?? 0

const leerSaldo = async (idProducto, transaction) => {
  const producto = await Producto.findByPk(idProducto, {
    attributes: ['idProducto', 'denominacion', 'stockActual'],
    transaction,
  })
  if (!producto) throw new NoEncontrado('El producto')
  return producto
}

// INVARIANTE: producto.stock_actual y movimiento_stock se escriben juntos o
// no se escribe ninguno. Por eso `transaction` es obligatorio y no opcional.
const registrarMovimiento = async (datos, transaction) => MovimientoStock.create(datos, { transaction })

/**
 * Descuenta existencias por una venta. Lanza StockInsuficiente si no alcanza.
 * @param {{idProducto:number, cantidad:number, idUsuario:number, idVenta:number}} orden
 * @param {import('sequelize').Transaction} transaction
 */
export const descontarPorVenta = async ({ idProducto, cantidad, idUsuario, idVenta }, transaction) => {
  const resultado = await sequelize.query(SQL_DESCONTAR, {
    replacements: { idProducto, cantidad },
    transaction,
  })

  if (filasAfectadas(resultado) === 0) {
    const producto = await leerSaldo(idProducto, transaction)
    throw new StockInsuficiente(producto.denominacion, producto.stockActual)
  }

  // Dentro de la transaccion, la lectura ve nuestra propia escritura.
  const producto = await leerSaldo(idProducto, transaction)

  await registrarMovimiento({
    idProducto,
    idUsuario,
    tipoMovimiento: 'VENTA',
    cantidad: -cantidad,
    stockResultante: producto.stockActual,
    idVenta,
  }, transaction)

  return producto.stockActual
}

/**
 * Restituye existencias por la anulacion de una venta (RF11.4).
 * No lleva guarda: sumar nunca deja el saldo negativo.
 */
export const restituirPorAnulacion = async ({ idProducto, cantidad, idUsuario, idVenta }, transaction) => {
  await sequelize.query(SQL_RESTITUIR, {
    replacements: { idProducto, cantidad },
    transaction,
  })

  const producto = await leerSaldo(idProducto, transaction)

  await registrarMovimiento({
    idProducto,
    idUsuario,
    tipoMovimiento: 'DEVOLUCION',
    cantidad,
    stockResultante: producto.stockActual,
    idVenta,
  }, transaction)

  return producto.stockActual
}
