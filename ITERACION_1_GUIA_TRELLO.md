# 📋 Roadmap & Tablero Trello — Iteración 1: Sistema "El Gringo Celulares"

Guía detallada de investigación, arquitectura y tareas paso a paso para el desarrollo de la **Primera Iteración** del proyecto de seminario.

---

## 📚 SECCIÓN 1: Temas de Investigación y Aprendizaje Previo

Antes y durante el desarrollo de cada parte, investiga los siguientes tópicos clave para asegurar una implementación sólida:

### 1. Base de Datos & ORM (MySQL + Sequelize)
- [ ] **Modelo de Herencia en SQL (Entidad `Persona`)**: Cómo modelar `Persona` como tabla base vinculada a `Usuario`, `Cliente` y `Proveedor` con relación 1 a 1.
- [ ] **Sequelize Models & Migrations / Sync**: Definición de modelos en Sequelize v6, tipos de datos (`DataTypes`), restricciones (`allowNull`, `unique`), y métodos `associate()`.
- [ ] **Transacciones en Sequelize (`sequelize.transaction`)**: Manejo transaccional indispensable para confirmar ventas y actualizar stock atómicamente (**RNF14**).
- [ ] **Bloqueo Optimista (Optimistic Locking)**: Uso de columna `version` en Sequelize para prevenir condiciones de carrera al descontar stock concurrente (**RNF05**).
- [ ] **Baja Lógica (Soft Deletes)**: Configuración de `paranoid: true` (`deletedAt`) en Sequelize para conservar historial.

### 2. Autenticación & Seguridad (JWT + Express)
- [ ] **Flujo Dual JWT (Access Token + Refresh Token)**:
  - Access Token (corta duración: ej. 15m a 1h) en headers `Authorization: Bearer <token>`.
  - Refresh Token (larga duración: ej. 7d) para renovar el access token sin desloguear al usuario (**RF01.1**).
- [ ] **Hashing de Contraseñas con `bcryptjs`**: `bcrypt.hash(password, 10)` y `bcrypt.compare(password, hash)` (**RNF09**).
- [ ] **Middlewares de Express**:
  - `authMiddleware.js`: Verificar y decodificar JWT.
  - `roleMiddleware.js` / `permissionMiddleware.js`: Validar en backend los permisos de lectura/escritura por módulo (**RNF18**).
- [ ] **Axios Interceptors en React**: Cómo interceptar respuestas `401 Unauthorized` para pedir refresh token y reintentar la petición transparente al usuario.

### 3. Frontend (React 18 + TailwindCSS + Context API)
- [ ] **Context API con `useReducer`**: Patrón de estado global para sesión (`AuthContext`), carrito/venta activa (`VentaContext`).
- [ ] **React Router v6 (`createBrowserRouter` / `<Routes>`)**: Configuración de rutas anidadas y componente `ProtectedRoute`.
- [ ] **Manejo de Formularios y Validaciones**: Estados controlados, validación de inputs y feedback con notificaciones (`sonner`).
- [ ] **Generación e Impresión de Códigos de Barras**:
  - Uso de `jsbarcode` (o `react-barcode`) para renderizar CODE128 o EAN13 en SVG/Canvas (**RF09.1**).
  - Uso de `react-to-print` para emitir etiquetas térmicas y comprobantes de venta no fiscales (**RF09.2**, **RF17**).

---

## 🗂️ SECCIÓN 2: Tablero Kanban / Trello (Iteración 1)

```
+-------------------+  +-------------------+  +-------------------+  +-------------------+
|    📋 BACKLOG     |  |   ⏳ EN PROGRESO  |  |    🔍 EN REVIEW   |  |     ✅ DONE       |
| (Tareas a iniciar)|  |  (Trabajando hoy) |  | (Probando/Ajuste) |  |(Completado y test)|
+-------------------+  +-------------------+  +-------------------+  +-------------------+
```

---

## 🎯 SECCIÓN 3: Desglose Detallado de Tareas (Cards de Trello)

---

### 📦 FASE 0: Base de Datos & Configuración Inicial

#### 🎴 CARD 0.1 — Configurar Conexión a Base de Datos MySQL
- **Módulo**: Backend / Core
- **Prioridad**: 🔴 Alta
- **Archivos**: `backend/src/config/database.js`, `backend/.env`
- **Tareas**:
  - [ ] Crear base de datos en MySQL: `sistema_gringo_celulares` con charset `utf8mb4` y motor `InnoDB`.
  - [ ] Configurar instancia de Sequelize en `backend/src/config/database.js` leyendo variables de `.env`.
  - [ ] Crear función `testConnection()` para verificar conexión al levantar el servidor.
- **Criterio de Aceptación**: Al ejecutar `npm run dev` en backend, la consola muestra "Conexión a MySQL establecida correctamente".

#### 🎴 CARD 0.2 — Modelar Entidades de Base de Datos (1ª Iteración)
- **Módulo**: Backend / Modelos
- **Prioridad**: 🔴 Alta
- **Archivos**: `backend/src/models/*`
- **Tablas a crear**:
  1. `Persona` (id, nombre, apellido, dni, telefono, email, direccion, estado)
  2. `Usuario` (id, personaId, username, passwordHash, perfilId, activo, ultimoAcceso)
  3. `Perfil` (id, nombre: 'Administrador' | 'Vendedor' | 'Técnico', descripcion)
  4. `Modulo` (id, codigo, nombre)
  5. `Permiso` (id, perfilId, moduloId, lectura, escritura)
  6. `Categoria` (id, nombre, descripcion, activo)
  7. `Marca` (id, nombre, activo)
  8. `Producto` (id, codigoInterno, codigoOriginal, nombre, descripcion, categoriaId, marcaId, precioCosto, precioMinorista, precioMayorista, stockActual, stockMinimo, imagenUrl, version, activo)
  9. `MovimientoStock` (id, productoId, tipoMovimiento: 'INGRESO' | 'VENTA' | 'ANULACION' | 'AJUSTE', cantidad, stockAnterior, stockNuevo, motivo, usuarioId, fecha)
  10. `TipoCliente` (id, nombre: 'Minorista' | 'Mayorista', descripcion)
  11. `Cliente` (id, personaId, tipoClienteId, observaciones, activo)
  12. `Venta` (id, numeroComprobante, clienteId, usuarioId, subtotal, descuento, total, medioPago: 'EFECTIVO' | 'MERCADOPAGO' | 'TARJETA', modalidadPago: 'CONTADO' | 'FINANCIACION_PROPIA' | 'GOCUOTAS', modalidadEntrega: 'LOCAL' | 'DOMICILIO', estado: 'COMPLETADA' | 'ANULADA', fecha)
  13. `DetalleVenta` (id, ventaId, productoId, cantidad, precioUnitario, costoUnitario, subtotal)
- **Criterio de Aceptación**: Sequelize sincroniza las 13 tablas con relaciones e integridad referencial en MySQL sin errores.

---

### 🔐 FASE 1: Módulo 1 — Administración y Seguridad (Auth & Usuarios)

#### 🎴 CARD 1.1 — Backend: Endpoints de Autenticación (RF01)
- **Prioridad**: 🔴 Alta
- **Endpoints**:
  - `POST /api/auth/login` → Valida credenciales, genera Access Token y Refresh Token.
  - `POST /api/auth/refresh` → Valida Refresh Token y devuelve nuevo Access Token.
  - `POST /api/auth/logout` → Invalida tokens de sesión.
  - `GET /api/auth/me` → Devuelve datos del usuario logueado con su rol y permisos.
  - `PUT /api/auth/cambiar-password` → Permite al usuario logueado actualizar su contraseña (**RF01.3**).
- **Archivos**: `controllers/authController.js`, `services/authService.js`, `routes/authRoutes.js`, `middlewares/authMiddleware.js`.

#### 🎴 CARD 1.2 — Backend: Endpoints de Gestión de Usuarios (RF02)
- **Prioridad**: 🟡 Media
- **Endpoints**:
  - `GET /api/usuarios` → Listado de usuarios con su perfil (**RF02.5**).
  - `POST /api/usuarios` → Alta de usuario + persona asociada (**RF02.1**).
  - `PUT /api/usuarios/:id` → Edición de datos (**RF02.2**).
  - `DELETE /api/usuarios/:id` → Baja lógica (**RF02.3**).
  - `PUT /api/usuarios/:id/perfil` → Cambiar rol asignado (**RF02.4**).

#### 🎴 CARD 1.3 — Frontend: Pantalla de Login & Estado Global de Auth
- **Prioridad**: 🔴 Alta
- **Archivos**: `frontend/src/contexts/AuthContext.jsx`, `frontend/src/pages/auth/LoginPage.jsx`, `frontend/src/services/authService.js`
- **Tareas**:
  - [ ] Implementar `AuthContext` con login, logout, persistencia en localStorage y verificación de sesión.
  - [ ] Diseñar pantalla de Login moderna con feedback de errores y carga visual.
  - [ ] Configurar `ProtectedRoute` en el router para redireccionar al login si no hay token.

#### 🎴 CARD 1.4 — Frontend: Panel de Administración de Usuarios
- **Prioridad**: 🟡 Media
- **Archivos**: `frontend/src/pages/usuarios/UsuariosPage.jsx`, `frontend/src/pages/usuarios/UsuarioFormModal.jsx`
- **Tareas**:
  - [ ] Tabla con lista de usuarios, estado y rol.
  - [ ] Modal interactivo para crear y editar usuarios.
  - [ ] Restricción de acceso: Solo visible para el perfil Administrador (**RF04.1**).

---

### 📦 FASE 2: Módulo 2 — Catálogo y Existencias

#### 🎴 CARD 2.1 — Backend: CRUD de Categorías y Marcas (RF07)
- **Prioridad**: 🟡 Media
- **Endpoints**:
  - `GET`, `POST`, `PUT`, `DELETE` en `/api/categorias` (**RF07.1**)
  - `GET`, `POST`, `PUT`, `DELETE` en `/api/marcas` (**RF07.2**)

#### 🎴 CARD 2.2 — Backend: CRUD de Productos & Generación de Código Interno (RF06, RF08, RF09)
- **Prioridad**: 🔴 Alta
- **Endpoints**:
  - `GET /api/productos` → Lista con filtros por categoría, marca y paginación.
  - `GET /api/productos/buscar?q=` → Búsqueda predictiva rápida por nombre, código interno o SKU (**RF06.5**).
  - `POST /api/productos` → Alta de producto con generación automática de código interno único (**RF09.1**) y precios (costo, minorista, mayorista) (**RF08.1-3**).
  - `PUT /api/productos/:id` → Edición de datos del producto.
  - `DELETE /api/productos/:id` → Baja lógica.
  - `POST /api/productos/:id/imagen` → Subida de imagen con Multer (**RF06.6**).
  - `PUT /api/productos/precios/masivo` → Actualización de precios por porcentaje sobre categoría o marca (**RF08.4**).

#### 🎴 CARD 2.3 — Backend: Control de Stock y Movimientos (RF11, RF12)
- **Prioridad**: 🔴 Alta
- **Endpoints**:
  - `GET /api/stock` → Vista de existencias actuales con indicador de stock bajo mínimo (**RF12.1**).
  - `POST /api/stock/ingreso` → Registrar entrada de mercadería incrementando existencias (**RF11.1**).
  - `POST /api/stock/ajuste` → Ajuste manual de stock con motivo y responsable (**RF11.5**).
  - `GET /api/stock/alertas` → Lista de productos que alcanzaron o están debajo del stock mínimo (**RF12.3**).
  - `GET /api/stock/:productoId/historial` → Historial de todos los movimientos de un producto (**RF12.4**).

#### 🎴 CARD 2.4 — Frontend: Vistas de Catálogo, Productos y Precios
- **Prioridad**: 🔴 Alta
- **Archivos**: `pages/catalogo/productos/*`, `pages/catalogo/categorias/*`, `pages/catalogo/precios/*`
- **Tareas**:
  - [ ] Tabla/grid interactiva de productos con imágenes, badges de stock y precios diferenciados.
  - [ ] Modal de alta/edición de producto con selector de categoría, marca y carga de imagen.
  - [ ] Ocultar precio de costo a usuarios con perfil Vendedor (**RF04.2**).
  - [ ] Interfaz para actualización masiva de precios por porcentaje.

#### 🎴 CARD 2.5 — Frontend: Impresión de Etiquetas con Código de Barras (RF09.2)
- **Prioridad**: 🟡 Media
- **Archivos**: `pages/catalogo/codigosBarras/GeneradorEtiquetas.jsx`, `components/ui/EtiquetaProducto.jsx`
- **Tareas**:
  - [ ] Renderizar código de barras con `JsBarcode` usando el código interno generado.
  - [ ] Diseñar etiqueta imprimible con: Nombre de producto, Precio de venta y Código de barras.
  - [ ] Integrar botón de impresión con `react-to-print`.

#### 🎴 CARD 2.6 — Frontend: Vista de Control de Stock y Alertas
- **Prioridad**: 🔴 Alta
- **Archivos**: `pages/stock/niveles/NivelesStockPage.jsx`, `pages/stock/movimientos/RegistrarIngresoModal.jsx`
- **Tareas**:
  - [ ] Panel con alertas visuales de productos con stock crítico/bajo.
  - [ ] Modal para registrar ingreso manual de mercadería y ajustes de inventario.
  - [ ] Historial de movimientos filtrable por fecha y producto.

---

### 👥 FASE 3: Módulo 3 — Gestión de Clientes

#### 🎴 CARD 3.1 — Backend: CRUD y Búsqueda de Clientes (RF13)
- **Prioridad**: 🔴 Alta
- **Endpoints**:
  - `GET /api/clientes` → Lista de clientes con paginación y filtros.
  - `GET /api/clientes/buscar?q=` → Búsqueda rápida por nombre, DNI o teléfono WhatsApp (**RF13.4**).
  - `POST /api/clientes` → Alta con clasificación (Minorista / Mayorista) y teléfono (**RF13.1, RF13.5, RF13.6**).
  - `PUT /api/clientes/:id` → Modificación de datos (**RF13.2**).
  - `DELETE /api/clientes/:id` → Baja lógica (**RF13.3**).

#### 🎴 CARD 3.2 — Frontend: Directorio y Gestión de Clientes
- **Prioridad**: 🟡 Media
- **Archivos**: `pages/clientes/ClientesPage.jsx`, `pages/clientes/ClienteFormModal.jsx`
- **Tareas**:
  - [ ] Tabla de clientes con buscador instantáneo, badge de tipo (Minorista/Mayorista) y botón de contacto por WhatsApp (`https://wa.me/...`).
  - [ ] Modal de alta rápida (utilizable también desde el módulo de ventas).

---

### 🛒 FASE 4: Módulo 4 — Ventas y Facturación

#### 🎴 CARD 4.1 — Backend: Motor Transaccional de Ventas (RF16, RF18)
- **Prioridad**: 🔴 Alta
- **Endpoints**:
  - `POST /api/ventas` → **Transacción crítica**:
    1. Valida stock de cada producto.
    2. Aplica automáticamente precio minorista o mayorista según el cliente (**RF16.5**).
    3. Registra venta y detalles con precios congelados.
    4. Descuenta existencias y genera registros en `MovimientoStock` (**RF11.2**).
    5. Bloqueo optimista para evitar stock negativo ante ventas concurrentes (**RNF05, RNF14**).
  - `GET /api/ventas` → Historial con filtros por período, cliente y estado (**RF18.1**).
  - `GET /api/ventas/:id` → Detalle completo de una venta.
  - `PUT /api/ventas/:id/anular` → **Transacción de anulación**: cambia estado a 'ANULADA', restituye existencias en stock y genera movimiento de ajuste (**RF18.2, RF11.4**).

#### 🎴 CARD 4.2 — Frontend: Terminal Punto de Venta (POS) (RF16)
- **Prioridad**: 🔴 Alta
- **Archivos**: `pages/ventas/registroVenta/POSPage.jsx`, `components/ventas/*`
- **Tareas**:
  - [ ] Buscador predictivo o ingreso directo por código interno/SKU (**RF16.2**).
  - [ ] Carrito lateral con ajuste de cantidades y eliminación de ítems (**RF16.3**).
  - [ ] Selector de cliente que recalcula automáticamente los precios a minorista o mayorista (**RF16.4, RF16.5**).
  - [ ] Selector de medio de pago (Efectivo, Mercado Pago, Tarjeta) y modalidad de entrega (Local / Domicilio) (**RF16.6, RF16.8, RF17.3**).
  - [ ] Botón de Confirmación de Venta con feedback inmediato (< 3 segundos - **RNF01**).

#### 🎴 CARD 4.3 — Frontend: Emisión e Impresión de Comprobante (RF17)
- **Prioridad**: 🔴 Alta
- **Archivos**: `components/ventas/ComprobanteVenta.jsx`, `components/ventas/ModalComprobante.jsx`
- **Tareas**:
  - [ ] Diseño de comprobante de venta no fiscal (logo, fecha, número comprobante, detalle de ítems, totales, medio de pago).
  - [ ] Modal post-venta automático con opción de impresión inmediata térmica/A4 vía `react-to-print`.

#### 🎴 CARD 4.4 — Frontend: Historial de Ventas y Anulación
- **Prioridad**: 🟡 Media
- **Archivos**: `pages/ventas/historial/HistorialVentasPage.jsx`, `pages/ventas/historial/DetalleVentaModal.jsx`
- **Tareas**:
  - [ ] Tabla de ventas con filtros de rango de fechas y buscador.
  - [ ] Vista del detalle completo de la venta.
  - [ ] Botón de Anulación con confirmación y motivo (solo perfiles autorizados).

---

### 🎨 FASE 5: Layout Global, UI & Navegación

#### 🎴 CARD 5.1 — Frontend: Dashboard & Navegación Principal
- **Prioridad**: 🔴 Alta
- **Archivos**: `components/layout/Sidebar.jsx`, `components/layout/Navbar.jsx`, `pages/dashboard/DashboardPage.jsx`
- **Tareas**:
  - [ ] Sidebar interactivo con navegación a: Dashboard, Catálogo, Stock, Clientes, Punto de Venta, Historial de Ventas, Usuarios.
  - [ ] Restricción visual de menús según permisos del usuario (**RF04.1**).
  - [ ] Topbar con nombre de usuario, rol actual, botón de cambio de contraseña y logout.
  - [ ] Dashboard con accesos rápidos y métricas básicas (alerta de stock bajo, ventas del día).

---

## 🧪 SECCIÓN 4: Plan de Verificación & Criterios de Éxito (RNFs)

| Requerimiento | Criterio a Verificar | Método de Prueba |
|---|---|---|
| **RNF01** | Venta registrada en < 3 segundos | Medir tiempo desde clic en confirmar hasta modal de comprobante. |
| **RNF02** | Búsqueda de productos en < 2 segundos | Búsqueda predictiva con filtro por texto en tiempo real. |
| **RNF05** | Concurrencia de 3 usuarios sin inconsistencias | Simular venta simultánea del último ítem en stock desde dos navegadores. |
| **RNF06** | Interfaz moderna (no estilo Excel) | Validación de diseño con dark mode, badges, cards, iconos y animaciones suaves. |
| **RNF09** | Contraseñas cifradas con hash | Inspeccionar tabla `usuarios` en MySQL y verificar hashes bcrypt. |
| **RNF14** | Integridad de existencias ante fallos | Probar fallo simulado en venta y verificar que la transacción haga rollback. |
| **RNF18** | Validación de permisos en servidor | Intentar peticiones a `/api/usuarios` con token de rol 'Vendedor' (debe dar 403 Forbidden). |

---
*Documento generado para el equipo de desarrollo de "El Gringo Celulares" — Iteración 1.*
