// src/services/usuariosService.js
// Interfaz final — CRUD de usuarios desde mocks.

import { USUARIOS as _base, PERFILES } from '../mocks/usuarios'

let _usuarios  = structuredClone(_base)
let _nextId    = _usuarios.length + 1
let _nextPersonaId = 100

function _delay(ms = 250) { return new Promise(r => setTimeout(r, ms)) }

/** GET /api/perfiles */
export async function getPerfiles() {
  await _delay(100)
  return PERFILES
}

/** GET /api/usuarios */
export async function getUsuarios() {
  await _delay()
  return _usuarios.filter(u => u.activo)
}

/** POST /api/usuarios */
export async function createUsuario(data) {
  await _delay()
  const perfil = PERFILES.find(p => p.id_perfil === Number(data.id_perfil))
  const persona = {
    id_persona:         _nextPersonaId++,
    nombre:             data.nombre,
    apellido:           data.apellido,
    tipo_documento:     data.tipo_documento ?? 'DNI',
    numero_documento:   data.numero_documento ?? null,
    telefono_whatsapp:  data.telefono_whatsapp ?? null,
    correo_electronico: data.correo_electronico ?? null,
    domicilio:          null,
  }
  const nuevo = {
    id_usuario:     _nextId++,
    id_persona:     persona.id_persona,
    id_perfil:      Number(data.id_perfil),
    nombre_usuario: data.nombre_usuario,
    activo:         1,
    persona,
    perfil: perfil ?? null,
  }
  _usuarios.push(nuevo)
  return nuevo
}

/** PUT /api/usuarios/:id */
export async function updateUsuario(id, data) {
  await _delay()
  const idx = _usuarios.findIndex(u => u.id_usuario === id)
  if (idx < 0) throw { status: 404, message: 'Usuario no encontrado.' }
  const perfil = PERFILES.find(p => p.id_perfil === Number(data.id_perfil ?? _usuarios[idx].id_perfil))
  _usuarios[idx] = {
    ..._usuarios[idx],
    nombre_usuario: data.nombre_usuario ?? _usuarios[idx].nombre_usuario,
    id_perfil:      Number(data.id_perfil ?? _usuarios[idx].id_perfil),
    perfil,
    persona: { ..._usuarios[idx].persona, ...data },
  }
  return _usuarios[idx]
}

/** DELETE /api/usuarios/:id — baja lógica */
export async function deleteUsuario(id) {
  await _delay()
  const u = _usuarios.find(u => u.id_usuario === id)
  if (!u) throw { status: 404, message: 'Usuario no encontrado.' }
  u.activo = 0
}

/** PUT /api/usuarios/:id/perfil */
export async function asignarPerfil(id, id_perfil) {
  await _delay()
  const u = _usuarios.find(u => u.id_usuario === id)
  if (!u) throw { status: 404, message: 'Usuario no encontrado.' }
  const perfil = PERFILES.find(p => p.id_perfil === Number(id_perfil))
  u.id_perfil = Number(id_perfil)
  u.perfil    = perfil ?? u.perfil
  return u
}
