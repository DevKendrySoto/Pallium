'use client'

import { Check, Eraser, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUploadDocument } from '@/features/documents'

/** Captura la firma del cuidador en un canvas y la sube a MinIO. */
export function SignaturePad({
  patientId,
  onUploaded,
}: {
  patientId: string
  onUploaded: (storageKey: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [saved, setSaved] = useState(false)
  const upload = useUploadDocument()

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = pos(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0f172a'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function clear() {
    const c = canvasRef.current
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
    setSaved(false)
  }

  function confirm() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return
      upload.mutate(
        { file: blob, fileName: 'firma.png', patientId, category: 'firma' },
        {
          onSuccess: (doc) => {
            setSaved(true)
            onUploaded(doc.storageKey)
          },
        },
      )
    }, 'image/png')
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={120}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={() => (drawing.current = false)}
        onPointerLeave={() => (drawing.current = false)}
        className="w-full touch-none rounded-md border border-slate-300 bg-white"
      />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          <Eraser size={16} /> Limpiar
        </Button>
        <Button type="button" size="sm" onClick={confirm} disabled={upload.isPending || saved}>
          {upload.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saved ? 'Firma guardada' : 'Confirmar firma'}
        </Button>
      </div>
    </div>
  )
}
