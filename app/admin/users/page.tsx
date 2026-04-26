'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/admin/AdminUI'
import { UserPlus, Pencil, Check, X, ShieldCheck, Briefcase, ToggleLeft, ToggleRight, KeyRound } from 'lucide-react'
import type { AdminUser, AdminRole } from '@/types'

const ROLE_LABEL: Record<AdminRole, string> = {
  superadmin: 'Superadmin',
  comercial:  'Comercial',
}
const ROLE_COLOR: Record<AdminRole, string> = {
  superadmin: 'bg-label-warning',
  comercial:  'bg-label-primary',
}

function RoleBadge({ role }: { role: AdminRole }) {
  return (
    <span className={`badge rounded-pill ${ROLE_COLOR[role]} d-inline-flex align-items-center gap-1`} style={{ fontSize: 11 }}>
      {role === 'superadmin' ? <ShieldCheck size={10} /> : <Briefcase size={10} />}
      {ROLE_LABEL[role]}
    </span>
  )
}

interface UserWithStats extends AdminUser {
  sites_count?: number
  sites_cost?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // New user form state
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState<AdminRole>('comercial')
  const [saving, setSaving]     = useState(false)
  const [formError, setFormError] = useState('')

  // Edit password state
  const [editPwId, setEditPwId]   = useState<string | null>(null)
  const [editPw, setEditPw]       = useState('')
  const [savingPw, setSavingPw]   = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function resetForm() {
    setName(''); setEmail(''); setPassword(''); setRole('comercial')
    setFormError(''); setShowForm(false); setEditId(null)
  }

  function startEdit(u: UserWithStats) {
    setName(u.name); setEmail(u.email); setRole(u.role)
    setPassword(''); setFormError(''); setEditId(u.id); setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setFormError('')
    const body = editId
      ? { name, email, role, ...(password ? { password } : {}) }
      : { name, email, password, role }

    const res = await fetch(editId ? `/api/users/${editId}` : '/api/users', {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) { resetForm(); load() }
    else { const d = await res.json(); setFormError(d.error ?? 'Error') }
    setSaving(false)
  }

  async function toggleActive(u: UserWithStats) {
    await fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !u.is_active }),
    })
    load()
  }

  async function savePassword(userId: string) {
    if (!editPw || editPw.length < 8) return
    setSavingPw(true)
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: editPw }),
    })
    setEditPwId(null); setEditPw(''); setSavingPw(false); load()
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <PageHeader
        title="Usuarios"
        subtitle="Gestiona el equipo de administración y comerciales"
        breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Usuarios' }]}
        action={
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="btn btn-primary d-flex align-items-center gap-2"
            style={{ fontSize: 13 }}
          >
            <UserPlus size={14} /> Nuevo usuario
          </button>
        }
      />

      {/* ── Create / Edit form ── */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0" style={{ fontSize: 13 }}>
              {editId ? 'Editar usuario' : 'Nuevo usuario'}
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label" style={{ fontSize: 12 }}>Nombre</label>
                  <input className="form-control form-control-sm" value={name} onChange={e => setName(e.target.value)} required placeholder="Nombre completo" />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={{ fontSize: 12 }}>Email</label>
                  <input type="email" className="form-control form-control-sm" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@empresa.com" />
                </div>
                <div className="col-md-2">
                  <label className="form-label" style={{ fontSize: 12 }}>Rol</label>
                  <select className="form-select form-select-sm" value={role} onChange={e => setRole(e.target.value as AdminRole)}>
                    <option value="comercial">Comercial</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label" style={{ fontSize: 12 }}>{editId ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
                  <input type="password" className="form-control form-control-sm" value={password} onChange={e => setPassword(e.target.value)} required={!editId} placeholder="Mín. 8 caracteres" minLength={8} />
                </div>
              </div>
              {formError && <p className="text-danger mt-2" style={{ fontSize: 12 }}>{formError}</p>}
              <div className="d-flex gap-2 mt-3">
                <button type="submit" disabled={saving} className="btn btn-sm btn-primary">
                  <Check size={12} className="me-1" />{saving ? 'Guardando…' : editId ? 'Actualizar' : 'Crear usuario'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-sm btn-outline-secondary">
                  <X size={12} className="me-1" />Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Users list ── */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0" style={{ fontSize: 13 }}>
            Equipo · {users.length} usuario{users.length !== 1 ? 's' : ''}
          </h5>
        </div>
        {loading ? (
          <div className="card-body text-center text-muted py-5" style={{ fontSize: 13 }}>Cargando…</div>
        ) : users.length === 0 ? (
          <div className="card-body text-center text-muted py-5" style={{ fontSize: 13 }}>
            No hay usuarios. <button className="btn btn-link p-0" onClick={() => setShowForm(true)}>Crea el primero</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0" style={{ fontSize: 13 }}>
              <thead>
                <tr className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th className="ps-4 fw-semibold">Usuario</th>
                  <th className="fw-semibold">Rol</th>
                  <th className="fw-semibold text-end">Webs creadas</th>
                  <th className="fw-semibold text-end">Coste total</th>
                  <th className="fw-semibold">Estado</th>
                  <th className="fw-semibold">Registro</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                    <td className="ps-4 py-3">
                      <div className="fw-semibold text-body-secondary">{u.name}</div>
                      <div className="text-body-secondary" style={{ fontSize: 11 }}>{u.email}</div>
                    </td>
                    <td className="py-3"><RoleBadge role={u.role} /></td>
                    <td className="py-3 text-end fw-semibold text-body-secondary">
                      {u.sites_count ?? 0}
                    </td>
                    <td className="py-3 text-end fw-bold text-primary">
                      {u.sites_cost ? `$${u.sites_cost.toFixed(3)}` : '—'}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        className={`btn btn-sm d-inline-flex align-items-center gap-1 ${u.is_active ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                        style={{ fontSize: 11, padding: '2px 8px' }}
                        title={u.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {u.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="py-3 text-body-secondary" style={{ fontSize: 12 }}>
                      {new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 pe-3">
                      <div className="d-flex align-items-center gap-1 justify-content-end">
                        {/* Inline password change */}
                        {editPwId === u.id ? (
                          <>
                            <input
                              type="password"
                              className="form-control form-control-sm"
                              style={{ width: 140, fontSize: 12 }}
                              placeholder="Nueva contraseña"
                              value={editPw}
                              onChange={e => setEditPw(e.target.value)}
                              minLength={8}
                              autoFocus
                            />
                            <button onClick={() => savePassword(u.id)} disabled={savingPw || editPw.length < 8}
                              className="btn btn-sm btn-success" style={{ fontSize: 11 }}>
                              <Check size={12} />
                            </button>
                            <button onClick={() => { setEditPwId(null); setEditPw('') }}
                              className="btn btn-sm btn-outline-secondary" style={{ fontSize: 11 }}>
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => { setEditPwId(u.id); setEditPw('') }}
                            className="btn btn-sm btn-outline-secondary" title="Cambiar contraseña"
                            style={{ fontSize: 11, padding: '3px 7px' }}>
                            <KeyRound size={12} />
                          </button>
                        )}
                        <button onClick={() => startEdit(u)}
                          className="btn btn-sm btn-outline-secondary" style={{ fontSize: 11, padding: '3px 7px' }}>
                          <Pencil size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
