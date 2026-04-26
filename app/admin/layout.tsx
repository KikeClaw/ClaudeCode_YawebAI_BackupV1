import type { Metadata } from 'next'
import { AdminLayoutWrapper } from '@/components/admin/AdminLayoutWrapper'

export const metadata: Metadata = {
  title: 'yaweb.ai — Admin',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Public Sans is self-hosted in /public/admin/fonts/ via @font-face
          in yaweb-theme.css — no CDN dependency, no CORS issues. */}
      <link rel="stylesheet" href="/admin/iconify-icons.css" />
      <link rel="stylesheet" href="/admin/core.css" />
      <link rel="stylesheet" href="/admin/demo.css" />
      <link rel="stylesheet" href="/admin/yaweb-theme.css" />

      <AdminLayoutWrapper>
        {children}
      </AdminLayoutWrapper>
    </>
  )
}
