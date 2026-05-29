interface Props {
  imageUrl?: string | null
}

export function TicketImagePreview({ imageUrl }: Props) {
  if (!imageUrl) return null
  return (
    <div className="rounded-md overflow-hidden shadow-level-2 bg-canvas-soft-2">
      <img src={imageUrl} alt="Ticket attachment" className="w-full aspect-video object-cover" />
    </div>
  )
}
