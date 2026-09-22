import { Router } from 'express'
import { autenticar } from '../../http/middlewares/autenticar.js'
import { autorizar } from '../../http/middlewares/autorizar.js'
import { listar, detalle } from './catalogo.controlador.js'

export const rutasCatalogo = Router()

rutasCatalogo.use(autenticar)

// RNF18 — el permiso se verifica en el servidor, ruta por ruta.
rutasCatalogo.get('/', autorizar('CATALOGO_STOCK', 'lectura'), listar)
rutasCatalogo.get('/:idProducto', autorizar('CATALOGO_STOCK', 'lectura'), detalle)
