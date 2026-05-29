import { z } from 'zod'

export const ticketCreateSchema = z.object({
  type: z.enum(['Broken', 'Empty']).refine((v) => !!v, 'Chọn loại ticket'),
  mode: z.enum(['list', 'freetext']),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  freeTextDesc: z.string().optional(),
  image: z.instanceof(File).optional(),
  deadline: z.date()
    .refine((d) => !!d, 'Chọn ngày hạn'),
  hour: z.coerce.number().int().min(0).max(23),
  minute: z.coerce.number().int().min(0).max(59),
}).superRefine((data, ctx) => {
  if (data.mode === 'list' && !data.productId) {
    ctx.addIssue({ code: 'custom', path: ['productId'], message: 'Vui lòng chọn sản phẩm' })
  }
  if (data.mode === 'freetext' && (!data.freeTextDesc || data.freeTextDesc.length < 10)) {
    ctx.addIssue({ code: 'custom', path: ['freeTextDesc'], message: 'Tối thiểu 10 ký tự' })
  }
  if (data.deadline) {
    const dt = new Date(data.deadline)
    dt.setHours(data.hour ?? 0, data.minute ?? 0, 0, 0)
    if (dt <= new Date()) {
      ctx.addIssue({ code: 'custom', path: ['deadline'], message: 'Ngày/giờ hạn phải ở tương lai' })
    }
  }
})

export type TicketCreateValues = z.infer<typeof ticketCreateSchema>
