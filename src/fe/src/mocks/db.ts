import { USERS } from './seed/users'
import { CATEGORIES, PRODUCTS } from './seed/categories'
import { TICKETS } from './seed/tickets'

type AnyRecord = Record<string, unknown>

export const db = {
  users:         [...USERS]      as AnyRecord[],
  categories:    [...CATEGORIES] as AnyRecord[],
  products:      [...PRODUCTS]   as AnyRecord[],
  tickets:       TICKETS.map((t) => ({ ...t, deadlineHistory: [...t.deadlineHistory] })) as AnyRecord[],
  notifications: [] as AnyRecord[],
}

export type Db = typeof db
