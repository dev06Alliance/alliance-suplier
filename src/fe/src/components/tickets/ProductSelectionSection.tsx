import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploadZone } from './ImageUploadZone'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { cn } from '@/lib/utils'
import type { TicketCreateValues } from '@/schemas/ticketCreate'

export function ProductSelectionSection() {
  const { watch, setValue, register, formState: { errors } } = useFormContext<TicketCreateValues>()
  const mode = watch('mode')
  const categoryId = watch('categoryId')

  const { data: categories } = useCategories()
  const { data: products } = useProducts(categoryId)

  // Reset productId when categoryId changes
  useEffect(() => {
    setValue('productId', '')
  }, [categoryId, setValue])

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-sm border border-hairline overflow-hidden w-fit">
        {([
          { value: 'list',     label: 'Chọn từ danh sách' },
          { value: 'freetext', label: 'Mô tả tự do' },
        ] as const).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setValue('mode', value)}
            className={cn(
              'px-3 py-1.5 text-sm transition-colors',
              mode === value
                ? 'bg-ink text-on-primary'
                : 'text-body hover:text-ink hover:bg-canvas-soft-2'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List mode */}
      {mode === 'list' && (
        <div className="space-y-3">
          <Select
            value={categoryId ?? ''}
            onValueChange={(v) => setValue('categoryId', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={watch('productId') ?? ''}
            onValueChange={(v) => setValue('productId', v)}
            disabled={!categoryId}
          >
            <SelectTrigger>
              <SelectValue placeholder={categoryId ? 'Chọn sản phẩm' : 'Chọn danh mục trước'} />
            </SelectTrigger>
            <SelectContent>
              {products?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.productId && (
            <p className="text-xs text-error">{errors.productId.message}</p>
          )}
        </div>
      )}

      {/* Free-text mode */}
      {mode === 'freetext' && (
        <div className="space-y-3">
          <Textarea
            placeholder="Mô tả đồ dùng (tối thiểu 10 ký tự)..."
            rows={3}
            {...register('freeTextDesc')}
          />
          {errors.freeTextDesc && (
            <p className="text-xs text-error">{errors.freeTextDesc.message}</p>
          )}
          <ImageUploadZone />
        </div>
      )}
    </div>
  )
}
