/**
 * Admin UI primitives — Sneat Bootstrap design system.
 * All components are server-safe (no hooks/state).
 * Uses Bootstrap/Sneat classes only — no inline styles except unavoidable specifics.
 */

import Link from 'next/link'
import type { ReactNode } from 'react'

// ─── Legacy token map — keep for JS-side colour references ───────────────────
export const C = {
  primary:     '#696cff',
  textPrimary: '#566a7f',
  textMuted:   '#8592a3',
  textSmall:   '#a1acb8',
  divider:     '#d9dee3',
}

// ─── PageHeader — Sneat page-title pattern ───────────────────────────────────

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumb?: Array<{ label: string; href?: string }>
  action?: ReactNode
}

export function PageHeader({ title, subtitle, breadcrumb, action }: PageHeaderProps) {
  return (
    <div className="d-flex align-items-start justify-content-between flex-wrap gap-4 mb-6">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-1">
            <ol className="breadcrumb breadcrumb-style1 mb-0">
              {breadcrumb.map((crumb, i) => (
                <li key={i} className={`breadcrumb-item${!crumb.href ? ' active' : ''}`}>
                  {crumb.href
                    ? <Link href={crumb.href} className="text-body-secondary">{crumb.label}</Link>
                    : <span>{crumb.label}</span>
                  }
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h4 className="fw-bold mb-0">{title}</h4>
        {subtitle && <p className="text-body-secondary mb-0 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0 d-flex gap-2">{action}</div>}
    </div>
  )
}

// ─── AdminCard — wraps Sneat card pattern ─────────────────────────────────────

interface AdminCardProps {
  title?: string
  titleIcon?: ReactNode
  headerRight?: ReactNode
  footer?: ReactNode
  noPadding?: boolean
  children: ReactNode
  style?: React.CSSProperties
  className?: string
}

export function AdminCard({
  title, titleIcon, headerRight, footer,
  noPadding, children, style, className,
}: AdminCardProps) {
  return (
    <div className={`card${className ? ` ${className}` : ''}`} style={style}>
      {title && (
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-0 d-flex align-items-center gap-2">
            {titleIcon && <span className="text-body-secondary">{titleIcon}</span>}
            {title}
          </h5>
          {headerRight && <div className="d-flex gap-2">{headerRight}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'card-body'}>
        {children}
      </div>
      {footer && (
        <div className="card-footer">{footer}</div>
      )}
    </div>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  demo:             { label: 'Demo',        cls: 'bg-label-warning'   },
  active:           { label: 'Activo',      cls: 'bg-label-success'   },
  inactive:         { label: 'Inactivo',    cls: 'bg-label-secondary' },
  expired:          { label: 'Expirado',    cls: 'bg-label-danger'    },
  new:              { label: 'Nuevo',       cls: 'bg-label-secondary' },
  demo_generating:  { label: 'Generando…', cls: 'bg-label-info'      },
  demo_ready:       { label: 'Demo lista',  cls: 'bg-label-warning'   },
  email_sent:       { label: 'Email env.',  cls: 'bg-label-primary'   },
  demo_visited:     { label: 'Visitó demo', cls: 'bg-label-warning'   },
  converted:        { label: 'Convertido',  cls: 'bg-label-success'   },
  rejected:         { label: 'Rechazado',   cls: 'bg-label-danger'    },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.inactive
  return <span className={`badge rounded-pill ${s.cls}`}>{s.label}</span>
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
  href?: string
  onClick?: () => void
  children: ReactNode
  variant?: 'primary' | 'success' | 'danger' | 'secondary' | 'outline-primary' | 'outline-secondary'
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
}

export function ActionButton({
  href, onClick, children,
  variant = 'primary', size = 'md', disabled, type = 'button',
}: ActionButtonProps) {
  const cls = `btn btn-${variant}${size === 'sm' ? ' btn-sm' : ''} d-inline-flex align-items-center gap-2`
  if (href) {
    return <Link href={href} className={cls}>{children}</Link>
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

// ─── SmallBox — Sneat KPI stat card ──────────────────────────────────────────

interface SmallBoxProps {
  value: string | number
  label: string
  icon: string
  color: 'primary' | 'success' | 'info' | 'warning' | 'danger'
  href?: string
  trend?: string
  trendUp?: boolean
}

export function SmallBox({ value, label, icon, color, href, trend, trendUp = true }: SmallBoxProps) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between mb-4">
          <p className="mb-0 text-body-secondary">{label}</p>
          <div className="avatar">
            <span className={`avatar-initial rounded bg-label-${color}`}>
              <i className={`icon-base bx ${icon} icon-md`} />
            </span>
          </div>
        </div>
        <h4 className="fw-bold mb-1">{value}</h4>
        {trend && (
          <small className={`fw-medium text-${trendUp ? 'success' : 'danger'}`}>
            <i className={`icon-base bx bx-${trendUp ? 'up' : 'down'}-arrow-alt`} /> {trend}
          </small>
        )}
        {href && (
          <Link href={href} className={`text-${color} small fw-semibold text-decoration-none mt-2 d-block`}>
            Ver más →
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = 'bx-data', title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-5">
      <i className={`icon-base bx ${icon} text-body-secondary mb-3 d-block`} style={{ fontSize: 48 }} />
      <h6 className="fw-semibold mb-1">{title}</h6>
      {description && <p className="text-body-secondary mb-3">{description}</p>}
      {action && action}
    </div>
  )
}
