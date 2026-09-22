import { Router } from 'express'
import { autenticar } from '../../http/middlewares/autenticar.js'
import { autorizar } from '../../http/middlewares/autorizar.js'
import { crearControladorVentas } from './ventas.controlador.js'

export const crearRutasVentas = (dependencias) => {
  const controlador = crearControladorVentas(dependencias)
  const rutas = Router()

  rutas.use(autenticar)

  // Antes de /:idVenta, o Express tomaria "medios-pago" como identificador.
  rutas.get('/medios-pago', autorizar('VENTAS', 'lectura'), controlador.mediosPago)

  rutas.post('/', autorizar('VENTAS', 'escritura'), controlador.confirmar)
  rutas.get('/:idVenta', autorizar('VENTAS', 'lectura'), controlador.detalle)
  rutas.get('/:idVenta/comprobante', autorizar('VENTAS', 'lectura'), controlador.comprobante)

  return rutas
}
