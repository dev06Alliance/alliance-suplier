import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <Inbox className="h-12 w-12 text-mute" />
      <div className="space-y-1">
        <p className="font-medium text-ink">{title}</p>
        <p className="text-sm text-mute">{description}</p>
      </div>
      {action}
    </div>
  )
}
