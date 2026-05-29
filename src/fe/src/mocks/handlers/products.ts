import { http, HttpResponse } from 'msw'
import { BASE, ok, err, requireAuth } from '../helpers'
import { db } from '../db'

export const productHandlers = [
  http.get(`${BASE}/products`, ({ request }) => {
    const { response } = requireAuth(request)
    if (response) return response

    const categoryId = new URL(request.url).searchParams.get('categoryId')
    const list = categoryId
      ? (db.products as Record<string, unknown>[]).filter((p) => p.categoryId === categoryId)
      : db.products
    return ok(list)
  }),

  http.post(`${BASE}/products`, async ({ request }) => {
    const { user, response } = requireAuth(request)
    if (response) return response
    if ((user as Record<string, unknown>).role !== 'Admin') return err('FORBIDDEN', 'Admin only.', 403)

    const { name, categoryId } = await request.json() as { name: string; categoryId: string }
    const product = { id: crypto.randomUUID(), name, categoryId, imageUrl: null }
    db.products.push(product)
    return HttpResponse.json({ success: true, data: product }, { status: 201 })
  }),

  http.put(`${BASE}/products/:id`, async ({ request, params }) => {
    const { user, response } = requireAuth(request)
    if (response) return response
    if ((user as Record<string, unknown>).role !== 'Admin') return err('FORBIDDEN', 'Admin only.', 403)

    const prod = (db.products as Record<string, unknown>[]).find((p) => p.id === params.id)
    if (!prod) return err('NOT_FOUND', 'Product not found.', 404)

    const body = await request.json() as Record<string, string>
    Object.assign(prod, body)
    return ok(prod)
  }),

  http.delete(`${BASE}/products/:id`, ({ request, params }) => {
    const { user, response } = requireAuth(request)
    if (response) return response
    if ((user as Record<string, unknown>).role !== 'Admin') return err('FORBIDDEN', 'Admin only.', 403)

    const idx = (db.products as Record<string, unknown>[]).findIndex((p) => p.id === params.id)
    if (idx === -1) return err('NOT_FOUND', 'Product not found.', 404)

    db.products.splice(idx, 1)
    return ok(null)
  }),
]
