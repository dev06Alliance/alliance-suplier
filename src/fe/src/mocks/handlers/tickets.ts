import { http, HttpResponse } from 'msw'
import { BASE, ok, err, requireAuth, formatTicket, formatTicketDetail, isOverdue } from '../helpers'
import { db } from '../db'
import { pushNotif } from '../pushNotif'

export const ticketHandlers = [
  http.get(`${BASE}/tickets`, ({ request }) => {
    const { user, response } = requireAuth(request)
    if (response) return response

    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status')
    const overdueFilter = url.searchParams.get('overdue') === 'true'

    let list = db.tickets as Record<string, unknown>[]

    if ((user as Record<string, unknown>).role === 'User') {
      list = list.filter((t) => t.requesterId === (user as Record<string, unknown>).id)
    }
    if (statusFilter) list = list.filter((t) => t.status === statusFilter)
    if (overdueFilter) list = list.filter((t) => isOverdue(t))

    return ok(list.map(formatTicket))
  }),

  http.get(`${BASE}/tickets/:id`, ({ request, params }) => {
    const { user, response } = requireAuth(request)
    if (response) return response

    const ticket = (db.tickets as Record<string, unknown>[]).find((t) => t.id === params.id)
    if (!ticket) return err('TICKET_NOT_FOUND', 'Ticket không tồn tại.', 404)

    const u = user as Record<string, unknown>
    if (u.role === 'User' && ticket.requesterId !== u.id) {
      return err('FORBIDDEN', 'Forbidden.', 403)
    }

    const detail = formatTicketDetail(ticket)
    if (u.role === 'User') detail.deadlineHistory = []

    return ok(detail)
  }),

  http.post(`${BASE}/tickets`, async ({ request }) => {
    const { user, response } = requireAuth(request)
    if (response) return response

    const fd = await request.formData()
    const type = fd.get('type') as string
    const deadline = fd.get('deadline') as string
    const productId = fd.get('productId') as string | null
    const freeTextDesc = fd.get('freeTextDesc') as string | null

    if (!type || !deadline) return err('VALIDATION_ERROR', 'type and deadline required.', 422)
    if (!productId && !freeTextDesc) return err('VALIDATION_ERROR', 'productId or freeTextDesc required.', 422)

    const newTicket = {
      id: crypto.randomUUID(),
      type, status: 'Pending',
      productId: productId ?? null,
      freeTextDesc: freeTextDesc ?? null,
      imageUrl: null,
      deadline,
      requesterId: (user as Record<string, unknown>).id,
      confirmedById: null,
      createdAt: new Date().toISOString(),
      deadlineHistory: [],
    }
    db.tickets.push(newTicket)

    const managers = db.users.filter((u) => (u as Record<string, unknown>).role === 'Manager')
    managers.forEach((m) => {
      pushNotif((m as Record<string, unknown>).id as string, 'TicketCreated', {
        ticketId: newTicket.id,
        requesterName: (user as Record<string, unknown>).name,
      })
    })

    return HttpResponse.json(
      { success: true, data: { id: newTicket.id, status: 'Pending', deadline: newTicket.deadline } },
      { status: 201 }
    )
  }),

  http.patch(`${BASE}/tickets/:id/confirm`, ({ request, params }) => {
    const { user, response } = requireAuth(request)
    if (response) return response

    const u = user as Record<string, unknown>
    if (u.role !== 'Manager') return err('FORBIDDEN', 'Chỉ Manager mới được xác nhận ticket.', 403)

    const ticket = (db.tickets as Record<string, unknown>[]).find((t) => t.id === params.id)
    if (!ticket) return err('TICKET_NOT_FOUND', 'Ticket không tồn tại.', 404)
    if (ticket.status !== 'Pending') return err('INVALID_STATE', 'Ticket must be Pending.', 422)

    ticket.status = 'Confirmed'
    ticket.confirmedById = u.id

    pushNotif(ticket.requesterId as string, 'TicketConfirmed', {
      ticketId: ticket.id,
      ticketType: ticket.type,
      productName: (db.products.find((p) => p.id === ticket.productId) as Record<string, unknown>)?.name ?? ticket.freeTextDesc,
    })

    return ok(formatTicketDetail(ticket))
  }),

  http.patch(`${BASE}/tickets/:id/done`, ({ request, params }) => {
    const { user, response } = requireAuth(request)
    if (response) return response

    const u = user as Record<string, unknown>
    if (u.role !== 'Manager') return err('FORBIDDEN', 'Chỉ Manager mới được đánh hoàn thành.', 403)

    const ticket = (db.tickets as Record<string, unknown>[]).find((t) => t.id === params.id)
    if (!ticket) return err('TICKET_NOT_FOUND', 'Ticket không tồn tại.', 404)
    if (ticket.status !== 'Confirmed') return err('INVALID_STATE', 'Ticket must be Confirmed.', 422)
    if (ticket.confirmedById !== u.id) return err('FORBIDDEN', 'Only the confirming manager can mark done.', 403)

    ticket.status = 'Done'

    pushNotif(ticket.requesterId as string, 'TicketDone', {
      ticketId: ticket.id,
      ticketType: ticket.type,
    })

    return ok(formatTicketDetail(ticket))
  }),

  http.patch(`${BASE}/tickets/:id/deadline`, async ({ request, params }) => {
    const { user, response } = requireAuth(request)
    if (response) return response

    const u = user as Record<string, unknown>
    if (u.role !== 'Manager') return err('FORBIDDEN', 'Chỉ Manager mới được gia hạn deadline.', 403)

    const ticket = (db.tickets as Record<string, unknown>[]).find((t) => t.id === params.id)
    if (!ticket) return err('TICKET_NOT_FOUND', 'Ticket không tồn tại.', 404)
    if (ticket.status === 'Done') return err('INVALID_STATE', 'Cannot extend deadline of a Done ticket.', 422)

    const { newDeadline, reason } = await request.json() as { newDeadline: string; reason: string }
    if (!newDeadline || !reason) return err('VALIDATION_ERROR', 'newDeadline and reason required.', 422)

    const historyEntry = {
      id: crypto.randomUUID(),
      oldDeadline: ticket.deadline,
      newDeadline,
      reason,
      changedById: u.id,
      changedAt: new Date().toISOString(),
    }
    ;(ticket.deadlineHistory as unknown[]).push(historyEntry)
    ticket.deadline = newDeadline

    return ok(formatTicketDetail(ticket))
  }),
]
