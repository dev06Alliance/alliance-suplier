import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { api } from '@/services/api'
import type { Category, Product } from '@/types/category'

// ── hooks ──────────────────────────────────────────────────────────────

function useCategoriesAdmin() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories') as unknown as { success: boolean; data: Category[] }
      return res.data
    },
  })
}

function useProductsAdmin(categoryId: string | null) {
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      const res = await api.get('/products?categoryId=' + categoryId) as unknown as { success: boolean; data: Product[] }
      return res.data
    },
    enabled: !!categoryId,
  })
}

// ── sub-components ─────────────────────────────────────────────────────

interface NameDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  initialValue?: string
  onConfirm: (name: string) => void
  isPending: boolean
}

function NameDialog({ open, onOpenChange, title, initialValue = '', onConfirm, isPending }: NameDialogProps) {
  const [name, setName] = useState(initialValue)

  useEffect(() => {
    if (open) setName(initialValue)
  }, [open, initialValue])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-1.5">
          <Label>Tên</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Hủy</Button>
          <Button onClick={() => onConfirm(name.trim())} disabled={!name.trim() || isPending}>
            {isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── main page ──────────────────────────────────────────────────────────

export function CategoryManagementPage() {
  const qc = useQueryClient()
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)

  // Category state
  const [catDialog, setCatDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: Category }>({ open: false, mode: 'add' })
  const [deleteCat, setDeleteCat] = useState<Category | null>(null)

  // Product state
  const [prodDialog, setProdDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: Product }>({ open: false, mode: 'add' })
  const [deleteProd, setDeleteProd] = useState<Product | null>(null)

  const { data: categories = [] } = useCategoriesAdmin()
  const { data: products = [] } = useProductsAdmin(selectedCatId)
  const selectedCat = categories.find((c) => c.id === selectedCatId)

  // Category mutations
  const addCat = useMutation({
    mutationFn: (name: string) => api.post('/categories', { name }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['categories'] }); setCatDialog({ open: false, mode: 'add' }); toast.success('Đã thêm danh mục') },
    onError: () => toast.error('Không thể thêm danh mục'),
  })
  const editCat = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.put('/categories/' + id, { name }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['categories'] }); setCatDialog({ open: false, mode: 'add' }); toast.success('Đã cập nhật danh mục') },
    onError: () => toast.error('Không thể cập nhật'),
  })
  const delCat = useMutation({
    mutationFn: (id: string) => api.delete('/categories/' + id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['categories'] })
      if (selectedCatId === deleteCat?.id) setSelectedCatId(null)
      setDeleteCat(null)
      toast.success('Đã xóa danh mục')
    },
    onError: () => toast.error('Không thể xóa'),
  })

  // Product mutations
  const addProd = useMutation({
    mutationFn: (name: string) => {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('categoryId', selectedCatId!)
      return api.post('/products', fd)
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['products', selectedCatId] }); setProdDialog({ open: false, mode: 'add' }); toast.success('Đã thêm sản phẩm') },
    onError: () => toast.error('Không thể thêm sản phẩm'),
  })
  const editProd = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => {
      const fd = new FormData()
      fd.append('name', name)
      return api.put('/products/' + id, fd)
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['products', selectedCatId] }); setProdDialog({ open: false, mode: 'add' }); toast.success('Đã cập nhật sản phẩm') },
    onError: () => toast.error('Không thể cập nhật'),
  })
  const delProd = useMutation({
    mutationFn: (id: string) => api.delete('/products/' + id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['products', selectedCatId] }); setDeleteProd(null); toast.success('Đã xóa sản phẩm') },
    onError: () => toast.error('Không thể xóa'),
  })

  return (
    <div className="space-y-4">
      <h1 className="display-md text-ink">Quản lý danh mục & sản phẩm</h1>

      <div className="flex gap-6 items-start">
        {/* Categories panel */}
        <div className="w-72 bg-canvas rounded-md shadow-level-2 overflow-hidden shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
            <span className="text-sm font-medium text-ink">Danh mục</span>
            <Button size="sm" variant="ghost" onClick={() => setCatDialog({ open: true, mode: 'add' })}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ul className="divide-y divide-hairline">
            {categories.length === 0 && (
              <li className="px-4 py-6 text-sm text-mute text-center">Chưa có danh mục</li>
            )}
            {categories.map((cat) => (
              <li
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group ${
                  selectedCatId === cat.id ? 'bg-canvas-soft border-l-2 border-ink' : 'hover:bg-canvas-soft-2'
                }`}
              >
                <span className="text-sm text-ink flex-1 truncate">{cat.name}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setCatDialog({ open: true, mode: 'edit', item: cat }) }}
                    className="p-1 text-mute hover:text-ink rounded"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteCat(cat) }}
                    className="p-1 text-mute hover:text-error rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight className="h-3.5 w-3.5 text-mute" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Products panel */}
        {selectedCat ? (
          <div className="flex-1 bg-canvas rounded-md shadow-level-2 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
              <span className="text-sm font-medium text-ink">Sản phẩm — {selectedCat.name}</span>
              <Button size="sm" variant="ghost" onClick={() => setProdDialog({ open: true, mode: 'add' })}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="divide-y divide-hairline">
              {products.length === 0 && (
                <li className="px-4 py-6 text-sm text-mute text-center">Chưa có sản phẩm trong danh mục này</li>
              )}
              {products.map((prod) => (
                <li key={prod.id} className="flex items-center justify-between px-4 py-3 group hover:bg-canvas-soft-2 transition-colors">
                  <span className="text-sm text-ink">{prod.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setProdDialog({ open: true, mode: 'edit', item: prod })}
                      className="p-1 text-mute hover:text-ink rounded"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteProd(prod)}
                      className="p-1 text-mute hover:text-error rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-16 text-mute text-sm">
            ← Chọn danh mục để xem sản phẩm
          </div>
        )}
      </div>

      {/* Category dialog */}
      <NameDialog
        open={catDialog.open}
        onOpenChange={(v) => setCatDialog((s) => ({ ...s, open: v }))}
        title={catDialog.mode === 'add' ? 'Thêm danh mục' : 'Sửa danh mục'}
        initialValue={catDialog.item?.name ?? ''}
        isPending={addCat.isPending || editCat.isPending}
        onConfirm={(name) => {
          if (catDialog.mode === 'add') addCat.mutate(name)
          else if (catDialog.item) editCat.mutate({ id: catDialog.item.id, name })
        }}
      />

      {/* Product dialog */}
      <NameDialog
        open={prodDialog.open}
        onOpenChange={(v) => setProdDialog((s) => ({ ...s, open: v }))}
        title={prodDialog.mode === 'add' ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}
        initialValue={prodDialog.item?.name ?? ''}
        isPending={addProd.isPending || editProd.isPending}
        onConfirm={(name) => {
          if (prodDialog.mode === 'add') addProd.mutate(name)
          else if (prodDialog.item) editProd.mutate({ id: prodDialog.item.id, name })
        }}
      />

      {/* Delete category confirm */}
      <AlertDialog open={!!deleteCat} onOpenChange={(v) => !v && setDeleteCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Danh mục <strong>{deleteCat?.name}</strong> sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCat && delCat.mutate(deleteCat.id)}
              className="bg-error text-on-primary hover:bg-error-deep"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete product confirm */}
      <AlertDialog open={!!deleteProd} onOpenChange={(v) => !v && setDeleteProd(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Sản phẩm <strong>{deleteProd?.name}</strong> sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProd && delProd.mutate(deleteProd.id)}
              className="bg-error text-on-primary hover:bg-error-deep"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
