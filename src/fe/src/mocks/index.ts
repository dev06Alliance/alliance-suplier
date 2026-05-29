import { authHandlers }         from './handlers/auth'
import { ticketHandlers }       from './handlers/tickets'
import { categoryHandlers }     from './handlers/categories'
import { productHandlers }      from './handlers/products'
import { notificationHandlers } from './handlers/notifications'
import { reportHandlers }       from './handlers/reports'
import { uploadHandlers }       from './handlers/uploads'

export const handlers = [
  ...authHandlers,
  ...ticketHandlers,
  ...categoryHandlers,
  ...productHandlers,
  ...notificationHandlers,
  ...reportHandlers,
  ...uploadHandlers,
]
