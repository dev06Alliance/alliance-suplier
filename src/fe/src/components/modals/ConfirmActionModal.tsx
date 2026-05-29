import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'confirm' | 'done' | null
  onConfirm: () => void
  isPending: boolean
}

export function ConfirmActionModal({ open, onOpenChange, action, onConfirm, isPending }: Props) {
  const isConfirm = action === 'confirm'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isConfirm ? 'Xác nhận ticket?' : 'Đánh dấu hoàn thành?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isConfirm
              ? 'Bạn sắp xác nhận ticket này. Hành động này không thể hoàn tác.'
              : 'Bạn sắp đánh dấu ticket này là hoàn thành. Hành động này không thể hoàn tác.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-ink text-on-primary hover:bg-ink/90"
          >
            {isPending ? 'Đang xử lý...' : isConfirm ? 'Xác nhận' : 'Hoàn thành'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
