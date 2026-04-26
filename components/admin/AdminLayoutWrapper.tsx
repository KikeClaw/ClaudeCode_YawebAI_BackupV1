'use client'

import { usePathname } from 'next/navigation'
import { AdminSidebar } from './Sidebar'
import { AdminNavbar } from './AdminNavbar'

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Login page renders without shell
  if (pathname === '/admin/login') return <>{children}</>

  return (
    <div className="layout-wrapper layout-content-navbar layout-menu-fixed">
      <div className="layout-container">
        <AdminSidebar />
        <div className="layout-page">
          <AdminNavbar />
          <div className="content-wrapper">
            <div className="flex-grow-1 d-flex flex-column">
              {children}
            </div>
            <div className="content-backdrop fade" />
          </div>
        </div>
      </div>
    </div>
  )
}
