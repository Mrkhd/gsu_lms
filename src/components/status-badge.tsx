import { Badge } from "@/components/ui/badge"

type Variant = React.ComponentProps<typeof Badge>["variant"]

const MAPS: Record<string, { label: string; variant: Variant }> = {
  // Publish status
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Published", variant: "default" },
  ARCHIVED: { label: "Archived", variant: "outline" },
  // Enrollment status
  ACTIVE: { label: "Active", variant: "default" },
  EXPIRED: { label: "Expired", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
  // Order status
  PENDING: { label: "Pending", variant: "secondary" },
  PAID: { label: "Paid", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "outline" },
  // Users
  SUSPENDED: { label: "Suspended", variant: "destructive" },
  ADMIN: { label: "Admin", variant: "default" },
  INSTRUCTOR: { label: "Instructor", variant: "secondary" },
  STUDENT: { label: "Student", variant: "outline" },
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = MAPS[status] ?? { label: status.replace(/_/g, " "), variant: "outline" as Variant }
  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  )
}
