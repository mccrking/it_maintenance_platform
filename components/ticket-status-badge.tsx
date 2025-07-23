import { Badge } from "@/components/ui/badge"
import type { Ticket } from "@/types/database"

interface TicketStatusBadgeProps {
  status: Ticket["status"]
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" | null | undefined
  let className = ""

  switch (status) {
    case "Pending":
      variant = "secondary"
      className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900 dark:text-yellow-200"
      break
    case "In Progress":
      variant = "default"
      className = "bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900 dark:text-blue-200"
      break
    case "Resolved":
      variant = "default"
      className = "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-200"
      break
    case "Closed":
      variant = "outline"
      className = "bg-gray-100 text-gray-800 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-200"
      break
    default:
      variant = "outline"
      break
  }

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  )
}
