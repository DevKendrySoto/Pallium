'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'

export interface UploadedDocument {
  id: string
  storageKey: string
  fileName: string
  contentType: string
  url: string
}

/** Sube un archivo a /documents (multipart) con el Bearer del store. */
async function uploadDocument(input: {
  file: File | Blob
  fileName: string
  patientId: string
  category?: string
}): Promise<UploadedDocument> {
  const token = useAuthStore.getState().token
  const form = new FormData()
  form.append('file', input.file, input.fileName)
  form.append('patientId', input.patientId)
  if (input.category) form.append('category', input.category)

  const res = await fetch(`${API_BASE_URL}/documents`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })
  if (!res.ok) throw new Error('No se pudo subir el archivo')
  return (await res.json()) as UploadedDocument
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: uploadDocument,
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Error al subir'),
  })
}
