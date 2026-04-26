import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdminJwt } from '@/lib/auth'

const BUCKET = 'hero-uploads'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  // Auth guard
  const token = req.cookies.get('admin_auth')?.value ?? ''
  const user = await verifyAdminJwt(token)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: 'El archivo supera el límite de 5 MB' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Formato no admitido. Usa JPG, PNG o WebP' }, { status: 400 })

    // Create bucket if it doesn't exist yet
    const { error: bucketErr } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_TYPES,
    })
    // Ignore "already exists" — any other error is real
    if (bucketErr && !bucketErr.message.toLowerCase().includes('already exists')) {
      console.error('[upload] bucket error:', bucketErr)
    }

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType: file.type, upsert: false })

    if (uploadErr) throw uploadErr

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('[upload] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
