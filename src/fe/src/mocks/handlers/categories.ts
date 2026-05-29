import { http, HttpResponse } from 'msw'
import { BASE, ok, err, requireAuth } from '../helpers'
import { db } from '../db'

export const categoryHandlers = [
  http.get(`${BASE}/categories`, ({ request }) => {
    const { response } = requireAuth(request)
    if (response) return response
    return ok(db.categories)
  }),

  http.post(`${BASE}/categories`, async ({ request }) => {
    const { user, response } = requireAuth(request)
    if (response) return response
    if ((user as Record<string, unknown>).role !== 'Admin') return err('FORBIDDEN', 'Admin only.', 403)

    const { name } = await request.json() as { name: string }
    const cat = { id: crypto.randomUUID(), name }
    db.categories.push(cat)
    return HttpResponse.json({ success: true, data: cat }, { status: 201 })
  }),

  http.put(`${BASE}/categories/:id`, async ({ request, params }) => {
    const { user, response } = requireAuth(request)
    if (response) return response
    if ((user as Record<string, unknown>).role !== 'Admin') return err('FORBIDDEN', 'Admin only.', 403)

    const cat = (db.categories as Record<string, unknown>[]).find((c) => c.id === params.id)
    if (!cat) return err('NOT_FOUND', 'Category not found.', 404)

    const { name } = await request.json() as { name: string }
    cat.name = name
    return ok(cat)
  }),

  http.delete(`${BASE}/categories/:id`, ({ request, params }) => {
    const { user, response } = requireAuth(request)
    if (response) return response
    if ((user as Record<string, unknown>).role !== 'Admin') return err('FORBIDDEN', 'Admin only.', 403)

    const idx = (db.categories as Record<string, unknown>[]).findIndex((c) => c.id === params.id)
    if (idx === -1) return err('NOT_FOUND', 'Category not found.', 404)

    db.categories.splice(idx, 1)
    return ok(null)
  }),
]
