import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { TicketCreateValues } from '@/schemas/ticketCreate'

export function ImageUploadZone() {
  const { setValue, watch } = useFormContext<TicketCreateValues>()
  const file = watch('image')

  const preview = file ? URL.createObjectURL(file) : null

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    onDrop: ([f]) => { if (f) setValue('image', f) },
    onDropRejected: () => toast.error('File phải là JPEG/PNG/WEBP và dưới 5MB'),
  })

  if (file && preview) {
    return (
      <div className="space-y-2">
        <div className="relative inline-block rounded-md overflow-hidden shadow-level-2">
          <img src={preview} className="w-40 h-28 object-cover" alt="Preview" />
          <button
            type="button"
            onClick={() => setValue('image', undefined)}
            className="absolute top-1 right-1 bg-ink/70 text-on-primary rounded-full h-5 w-5 text-xs flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-mute">{file.name} ({(file.size / 1024).toFixed(0)}KB)</p>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed border-hairline rounded-md p-6 text-center cursor-pointer hover:border-hairline-strong transition-colors',
        isDragActive && 'border-link bg-link-bg-soft'
      )}
    >
      <input {...getInputProps()} />
      <Upload className="h-6 w-6 text-mute mx-auto mb-2" />
      <p className="text-sm text-body">
        Kéo ảnh vào đây hoặc <span className="text-link">chọn file</span>
      </p>
      <p className="text-xs text-mute mt-1">JPEG, PNG, WEBP — tối đa 5MB</p>
    </div>
  )
}
