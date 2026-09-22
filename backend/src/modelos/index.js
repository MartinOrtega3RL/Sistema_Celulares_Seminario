// Punto unico donde se declaran las asociaciones. Los archivos de modelo solo
// definen columnas; si cada uno declarara sus relaciones, importarse entre
// ellos crearia ciclos.

import { Persona, Perfil, Modulo, Permiso, Usuario, Sesion } from './acceso.js'
import { Categoria, Marca, Producto } from './catalogo.js'
import { MovimientoStock } from './existencias.js'
import { TipoCliente, Cliente } from './clientes.js'
import { MedioPago, Venta, DetalleVenta, PagoVenta } from './ventas.js'
import { ParametroSistema } from './sistema.js'

// --- Acceso ------------------------------------------------------------------
Usuario.belongsTo(Persona, { foreignKey: 'idPersona', as: 'persona' })
Usuario.belongsTo(Perfil, { foreignKey: 'idPerfil', as: 'perfil' })
Persona.hasOne(Usuario, { foreignKey: 'idPersona', as: 'usuario' })

Perfil.belongsToMany(Modulo, { through: Permiso, foreignKey: 'idPerfil', otherKey: 'idModulo', as: 'modulos' })
Modulo.belongsToMany(Perfil, { through: Permiso, foreignKey: 'idModulo', otherKey: 'idPerfil', as: 'perfiles' })
Permiso.belongsTo(Perfil, { foreignKey: 'idPerfil', as: 'perfil' })
Permiso.belongsTo(Modulo, { foreignKey: 'idModulo', as: 'modulo' })
Perfil.hasMany(Permiso, { foreignKey: 'idPerfil', as: 'permisos' })

Sesion.belongsTo(Usuario, { foreignKey: 'idUsuario', as: 'usuario' })
Usuario.hasMany(Sesion, { foreignKey: 'idUsuario', as: 'sesiones' })

// --- Catalogo ----------------------------------------------------------------
Producto.belongsTo(Categoria, { foreignKey: 'idCategoria', as: 'categoria' })
Producto.belongsTo(Marca, { foreignKey: 'idMarca', as: 'marca' })
Categoria.hasMany(Producto, { foreignKey: 'idCategoria', as: 'productos' })
Marca.hasMany(Producto, { foreignKey: 'idMarca', as: 'productos' })

// --- Existencias -------------------------------------------------------------
MovimientoStock.belongsTo(Producto, { foreignKey: 'idProducto', as: 'producto' })
MovimientoStock.belongsTo(Usuario, { foreignKey: 'idUsuario', as: 'usuario' })
MovimientoStock.belongsTo(Venta, { foreignKey: 'idVenta', as: 'venta' })
Producto.hasMany(MovimientoStock, { foreignKey: 'idProducto', as: 'movimientos' })
// idRecepcion e idOrden apuntan a tablas de modulos diferidos: existen en la
// base con su clave foranea, pero no se mapean todavia.

// --- Clientes ----------------------------------------------------------------
Cliente.belongsTo(Persona, { foreignKey: 'idPersona', as: 'persona' })
Cliente.belongsTo(TipoCliente, { foreignKey: 'idTipoCliente', as: 'tipoCliente' })
Persona.hasOne(Cliente, { foreignKey: 'idPersona', as: 'cliente' })
TipoCliente.hasMany(Cliente, { foreignKey: 'idTipoCliente', as: 'clientes' })

// --- Ventas ------------------------------------------------------------------
Venta.belongsTo(Cliente, { foreignKey: 'idCliente', as: 'cliente' })
Venta.belongsTo(Usuario, { foreignKey: 'idUsuario', as: 'vendedor' })
Venta.belongsTo(Usuario, { foreignKey: 'idUsuarioAnulacion', as: 'anuladoPor' })

Venta.hasMany(DetalleVenta, { foreignKey: 'idVenta', as: 'detalle' })
DetalleVenta.belongsTo(Venta, { foreignKey: 'idVenta', as: 'venta' })
DetalleVenta.belongsTo(Producto, { foreignKey: 'idProducto', as: 'producto' })

Venta.hasOne(PagoVenta, { foreignKey: 'idVenta', as: 'pago' })
PagoVenta.belongsTo(Venta, { foreignKey: 'idVenta', as: 'venta' })
PagoVenta.belongsTo(MedioPago, { foreignKey: 'idMedioPago', as: 'medioPago' })

Venta.hasMany(MovimientoStock, { foreignKey: 'idVenta', as: 'movimientos' })

export {
  Persona, Perfil, Modulo, Permiso, Usuario, Sesion,
  Categoria, Marca, Producto,
  MovimientoStock,
  TipoCliente, Cliente,
  MedioPago, Venta, DetalleVenta, PagoVenta,
  ParametroSistema,
}
