'use client'

import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useUploadDocument } from '@/features/documents'
import type { CompProps } from '@/types/clinical'

interface PhotoRef {
  storageKey: string
  url: string
  fileName: string
}

export function PhotoAttachment({ config, value, onChange, ctx }: CompProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadDocument()
  const photos = (value.photos as PhotoRef[]) ?? []
  const maxPhotos = (config.maxPhotos as number) ?? 6

  if (!ctx) return <p className="text-sm text-muted-foreground">Fotos no disponibles fuera de una visita.</p>

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !ctx) return
    upload.mutate(
      { file, fileName: file.name, patientId: ctx.patientId, category: 'clinica' },
      {
        onSuccess: (doc) =>
          onChange({
            ...value,
            photos: [...photos, { storageKey: doc.storageKey, url: doc.url, fileName: doc.fileName }],
          }),
      },
    )
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div key={p.storageKey} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.fileName} className="h-20 w-20 rounded-md border border-slate-200 object-cover" />
            <button
              type="button"
              onClick={() => onChange({ ...value, photos: photos.filter((_, idx) => idx !== i) })}
              className="absolute -right-2 -top-2 rounded-full bg-danger p-0.5 text-danger-foreground"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPick}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={upload.isPending || photos.length >= maxPhotos}
        onClick={() => inputRef.current?.click()}
      >
        {upload.isPending ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        Agregar foto
      </Button>
    </div>
  )
}
