import { http, HttpResponse } from 'msw'
import { BASE, requireAuth } from '../helpers'

export const uploadHandlers = [
  http.post(`${BASE}/uploads`, ({ request }) => {
    const { response } = requireAuth(request)
    if (response) return response

    const fakeFilename = `${crypto.randomUUID()}.jpg`
    return HttpResponse.json(
      { success: true, data: { url: `/uploads/${fakeFilename}` } },
      { status: 201 }
    )
  }),
]
