'use client'

import { useRouter } from 'next/navigation'
import { ColorEditor } from './ColorEditor'
import { SectionRegenPanel } from './SectionRegenPanel'

export function ClientDetailPanels({ clientId }: { clientId: string }) {
  const router = useRouter()
  return (
    <>
      <ColorEditor clientId={clientId} onUpdate={() => router.refresh()} />
      <SectionRegenPanel clientId={clientId} onUpdate={() => router.refresh()} />
    </>
  )
}
