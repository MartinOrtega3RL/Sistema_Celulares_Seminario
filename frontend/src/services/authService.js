// src/services/authService.js
// Interfaz final: cuando el backend esté listo, reemplazás el body de cada
// función por la llamada axios equivalente. Las pantallas no cambian.
//
// Cambio a producción:
//   import api from './api'
//   export async function login(credenciales) { return api.post('/auth/login', credenciales) }

import { USUARIOS, PERMISOS } from '../mocks/usuarios'

const STORAGE_KEY = 'gringo_session'

/** Simula POST /api/auth/login */
export async function login({ nombre_usuario, contrasena }) {
  await _delay(400)

  const usuario = USUARIOS.find(
    u => u.nombre_usuario === nombre_usuario && u.activo === 1,
  )
  // En mock, cualquier contraseña es válida mientras el usuario exista
  if (!usuario) {
    throw { status: 401, message: 'Usuario o contraseña incorrectos.' }
  }

  const permisos = PERMISOS[usuario.id_perfil] ?? {}
  const token    = _fakeJwt(usuario)

  const session = { usuario, permisos, token }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

/** Simula POST /api/auth/logout */
export async function logout() {
  await _delay(100)
  sessionStorage.removeItem(STORAGE_KEY)
}

/** Simula GET /api/auth/me */
export async function getMe() {
  await _delay(150)
  const stored = sessionStorage.getItem(STORAGE_KEY)
  if (!stored) throw { status: 401, message: 'No hay sesión activa.' }
  return JSON.parse(stored)
}

/** Simula PUT /api/auth/cambiar-password */
export async function cambiarPassword({ contrasena_actual, contrasena_nueva }) {
  await _delay(300)
  if (!contrasena_actual || !contrasena_nueva) {
    throw { status: 400, message: 'Completá todos los campos.' }
  }
  if (contrasena_nueva.length < 8) {
    throw { status: 400, message: 'La contraseña debe tener al menos 8 caracteres.' }
  }
  return { message: 'Contraseña actualizada correctamente.' }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function _delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function _fakeJwt(usuario) {
  const payload = btoa(JSON.stringify({ id: usuario.id_usuario, exp: Date.now() + 3_600_000 }))
  return `mock.${payload}.sig`
}
