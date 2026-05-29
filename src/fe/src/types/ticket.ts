export type TicketType = 'Broken' | 'Empty'
export type TicketStatus = 'Pending' | 'Confirmed' | 'Done'

export interface Ticket {
  id: string
  type: TicketType
  status: TicketStatus
  productId: string | null
  freeTextDesc: string | null
  imageUrl: string | null
  deadline: string
  requesterId: string
  confirmedById: string | null
  createdAt: string
  isOverdue: boolean
  product: {
    id: string
    name: string
    categoryId: string
    categoryName: string | null
  } | null
  requester: { id: string; name: string } | null
}

export interface DeadlineHistoryEntry {
  id: string
  oldDeadline: string
  newDeadline: string
  reason: string
  changedById: string
  changedBy: { id: string; name: string } | null
  changedAt: string
}

export interface TicketDetail extends Ticket {
  confirmedBy: { id: string; name: string } | null
  deadlineHistory: DeadlineHistoryEntry[]
}
