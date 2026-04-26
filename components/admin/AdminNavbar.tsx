/**
 * AdminNavbar — Sneat-style top bar.
 * Server component (no hooks needed).
 */
export function AdminNavbar() {
  return (
    <nav
      className="layout-navbar container-xxl navbar-detached navbar navbar-expand-xl align-items-center bg-navbar-theme"
      id="layout-navbar"
    >
      {/* Mobile menu toggle */}
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-4 me-xl-0 d-xl-none">
        <a className="nav-item nav-link px-0 me-xl-6" href="#">
          <i className="icon-base bx bx-menu icon-md" />
        </a>
      </div>

      <div
        className="navbar-nav-right d-flex align-items-center"
        id="navbar-collapse"
      >
        {/* Search */}
        <div className="navbar-nav align-items-center me-auto">
          <div className="nav-item d-flex align-items-center">
            <i className="icon-base bx bx-search icon-md" style={{ opacity: 0.5 }} />
            <input
              type="text"
              className="form-control border-0 shadow-none ps-2"
              placeholder="Buscar..."
              aria-label="Buscar"
            />
          </div>
        </div>

        {/* Right items */}
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          <li className="nav-item">
            <a className="nav-link p-0" href="/admin/settings" title="Configuración">
              <div className="avatar avatar-online">
                <span
                  className="avatar-initial rounded-circle bg-label-primary"
                  style={{
                    width: 38,
                    height: 38,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: '-0.03em',
                  }}
                >
                  ya
                </span>
              </div>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}
