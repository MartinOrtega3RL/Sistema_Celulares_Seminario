import { DataTypes } from 'sequelize'
import { sequelize } from '../config/base-de-datos.js'

// Contexto Clientes. Cliente es una especializacion de persona: la identidad
// vive en persona, la relacion comercial vive aca.
//
// Ojo con la palabra "cliente": aca significa una clasificacion de lista de
// precios. En Servicio Tecnico (diferido) significa el dueno de un equipo.
// Son dos cosas distintas y no se unifican.

export const TipoCliente = sequelize.define('TipoCliente', {
  idTipoCliente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id_tipo_cliente' },
  nombre: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  // Determina que precio del producto se aplica en la venta (RF16.5).
  listaPrecioAplicable: {
    type: DataTypes.ENUM('MINORISTA', 'MAYORISTA'),
    allowNull: false,
    field: 'lista_precio_aplicable',
  },
}, { tableName: 'tipo_cliente' })

export const Cliente = sequelize.define('Cliente', {
  idCliente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id_cliente' },
  idPersona: { type: DataTypes.INTEGER, allowNull: false, field: 'id_persona' },
  idTipoCliente: { type: DataTypes.INTEGER, allowNull: false, field: 'id_tipo_cliente' },
  fechaAlta: { type: DataTypes.DATE, field: 'fecha_alta' },
  observaciones: { type: DataTypes.STRING(300), allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'cliente' })
