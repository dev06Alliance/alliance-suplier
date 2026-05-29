import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { TicketTypeSection } from '@/components/tickets/TicketTypeSection'
import { ProductSelectionSection } from '@/components/tickets/ProductSelectionSection'
import { DeadlinePicker } from '@/components/tickets/DeadlinePicker'
import { useCreateTicket } from '@/hooks/useCreateTicket'
import { ticketCreateSchema, type TicketCreateValues } from '@/schemas/ticketCreate'

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-canvas rounded-md shadow-level-1 p-5">
      <h2 className="display-sm text-ink mb-4">{title}</h2>
      {children}
    </div>
  )
}

export function CreateTicketPage() {
  const form = useForm<TicketCreateValues>({
    resolver: zodResolver(ticketCreateSchema),
    defaultValues: { mode: 'list', hour: 17, minute: 0 },
  })

  const { mutate, isPending } = useCreateTicket()

  return (
    <div className="pb-24">
      <div className="mb-6">
        <h1 className="display-md text-ink">Báo hỏng / hết đồ dùng</h1>
        <p className="text-sm text-body mt-1">Điền thông tin để gửi yêu cầu xử lý.</p>
      </div>

      <FormProvider {...form}>
        <form
          id="create-ticket-form"
          onSubmit={form.handleSubmit((v) => mutate(v))}
          className="space-y-4"
        >
          <SectionCard title="Loại yêu cầu">
            <TicketTypeSection />
          </SectionCard>

          <SectionCard title="Sản phẩm">
            <ProductSelectionSection />
          </SectionCard>

          <SectionCard title="Thời hạn xử lý">
            <DeadlinePicker />
          </SectionCard>
        </form>
      </FormProvider>

      <footer className="fixed bottom-0 left-60 right-0 bg-canvas border-t border-hairline px-6 py-4 flex justify-end shadow-level-1">
        <Button
          type="submit"
          form="create-ticket-form"
          disabled={isPending}
          className="px-6"
        >
          {isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </Button>
      </footer>
    </div>
  )
}
