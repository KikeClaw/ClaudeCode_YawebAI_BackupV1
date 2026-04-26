'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { AdminRole } from '@/types'
import { ADMIN_VERSION } from '@/lib/admin-version'

interface MeUser { id: string; name: string; email: string; role: AdminRole }

type NavItem = { href: string; label: string; icon: string; exact?: boolean; superadminOnly?: boolean }
type NavGroup = { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Crear',
    items: [
      { href: '/admin/clients/new', label: 'Nueva Web', icon: 'bx-plus-circle', exact: true },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { href: '/admin/clients',   label: 'Webs',     icon: 'bx-globe' },
      { href: '/admin/clientes',  label: 'Clientes', icon: 'bx-buildings' },
      { href: '/admin/portfolio', label: 'Demos',    icon: 'bx-photo-album' },
    ],
  },
  {
    label: 'Outreach',
    items: [
      { href: '/admin/leads',     label: 'Leads',      icon: 'bx-user-pin' },
      { href: '/admin/bulk',      label: 'Prospectar', icon: 'bx-search-alt' },
      { href: '/admin/whatsapp',  label: 'WhatsApp',   icon: 'bxl-whatsapp' },
      { href: '/admin/campaigns', label: 'Campañas',   icon: 'bx-mail-send' },
    ],
  },
  {
    label: 'Datos',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: 'bx-bar-chart-alt-2' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/users',    label: 'Usuarios',      icon: 'bx-group',  superadminOnly: true },
      { href: '/admin/settings', label: 'Configuración', icon: 'bx-cog',    superadminOnly: true },
      { href: '/admin/setup',    label: 'Setup',          icon: 'bx-wrench', superadminOnly: true },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => { if (d.user) setMe(d.user) }).catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    const allHrefs = NAV_GROUPS.flatMap(g => g.items).map(i => i.href)
    const siblingMatch = allHrefs.some(
      other => other !== href && other.startsWith(href) && pathname.startsWith(other)
    )
    if (siblingMatch) return false
    return pathname.startsWith(href)
  }

  const isSuperAdmin = !me || me.role === 'superadmin' // assume superadmin until loaded

  return (
    <aside id="layout-menu" className="layout-menu menu-vertical menu bg-menu-theme" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Brand ── */}
      <div className="app-brand demo">
        <Link href="/admin" className="app-brand-link">
          <span className="app-brand-logo demo">
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 36,
              background: 'linear-gradient(135deg, #696cff 0%, #5f61e6 100%)',
              borderRadius: 6, color: '#fff', fontWeight: 900, fontSize: 11,
            }}>
              ya
            </span>
          </span>
          <span className="app-brand-text demo menu-text fw-bold ms-2">
            yaweb<span style={{ opacity: 0.45 }}>.ai</span>
          </span>
        </Link>
        <a href="#" className="layout-menu-toggle menu-link text-large ms-auto d-xl-none">
          <i className="bx bx-chevron-left d-block align-middle" />
        </a>
      </div>

      <div className="menu-divider mt-0" />
      <div className="menu-inner-shadow" />

      <ul className="menu-inner py-1" style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>

        {/* Dashboard */}
        <li className={`menu-item${pathname === '/admin' ? ' active' : ''}`}>
          <Link href="/admin" className="menu-link">
            <i className="menu-icon tf-icons bx bx-home-smile" />
            <div className="text-truncate">Dashboard</div>
          </Link>
        </li>

        {/* Nav groups */}
        {NAV_GROUPS.map(group => (
          <React.Fragment key={group.label}>
            <li className="menu-header small text-uppercase">
              <span className="menu-header-text">{group.label}</span>
            </li>
            {group.items
              .filter(item => !item.superadminOnly || isSuperAdmin)
              .map(({ href, label, icon, exact }) => (
                <li key={href} className={`menu-item${isActive(href, exact) ? ' active' : ''}`}>
                  <Link href={href} className="menu-link">
                    <i className={`menu-icon tf-icons bx ${icon}`} />
                    <div className="text-truncate">{label}</div>
                  </Link>
                </li>
              ))}
          </React.Fragment>
        ))}

        {/* User info + logout */}
        <li className="menu-header small text-uppercase">
          <span className="menu-header-text">Cuenta</span>
        </li>

        {me && (
          <li className="menu-item">
            <div className="menu-link" style={{ cursor: 'default', pointerEvents: 'none' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: me.role === 'superadmin' ? 'rgba(255,185,0,0.15)' : 'rgba(105,108,255,0.15)',
                color: me.role === 'superadmin' ? '#c99400' : '#696cff',
                fontWeight: 800, fontSize: 12, marginRight: 2,
              }}>
                {me.name[0]?.toUpperCase()}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="text-truncate fw-semibold" style={{ fontSize: 13, color: '#384551' }}>{me.name}</div>
                <div className="text-truncate" style={{ fontSize: 11, color: '#a1acb8' }}>
                  {me.role === 'superadmin' ? 'Superadmin' : 'Comercial'}
                </div>
              </div>
            </div>
          </li>
        )}

        <li className="menu-item">
          <button
            onClick={handleLogout}
            className="menu-link border-0 bg-transparent text-start"
            style={{ width: '100%', cursor: 'pointer' }}
          >
            <i className="menu-icon tf-icons bx bx-log-out" />
            <div className="text-truncate">Salir</div>
          </button>
        </li>

        {/* Version badge */}
        <li className="menu-item" style={{ marginTop: 'auto' }}>
          <div style={{
            margin: '8px 16px 12px',
            padding: '4px 8px',
            background: 'rgba(105,108,255,0.08)',
            borderRadius: 6,
            fontSize: 11,
            color: '#a1acb8',
            textAlign: 'center',
            fontFamily: 'monospace',
            letterSpacing: '0.02em',
          }}>
            {ADMIN_VERSION}
          </div>
        </li>

      </ul>
    </aside>
  )
}
