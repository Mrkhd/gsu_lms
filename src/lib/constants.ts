import {
  Bell,
  BookOpen,
  Boxes,
  CreditCard,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  School,
  Settings,
  ShoppingCart,
  TicketCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

export const APP_NAME = "GSU Postgraduate"
export const APP_SHORT_NAME = "GSU"
export const APP_DESCRIPTION =
  "GSU's postgraduate learning portal — semester-based programs, online courses and time-limited access."

/** Access duration presets offered in course/bundle builders (days). null = lifetime. */
export const ACCESS_DURATION_PRESETS: { label: string; days: number | null }[] = [
  { label: "Lifetime", days: null },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
  { label: "12 months", days: 365 },
]

export const DEFAULT_ACCESS_DURATION_DAYS = 180

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export type NavSection = {
  label?: string
  items: NavItem[]
}

export const ADMIN_NAV: NavSection[] = [
  { items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
  {
    label: "Learning",
    items: [
      { label: "Programs", href: "/admin/programs", icon: School },
      { label: "Courses", href: "/admin/courses", icon: BookOpen },
      { label: "Semester packages", href: "/admin/bundles", icon: Boxes },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
    ],
  },
  {
    label: "Users",
    items: [
      { label: "Students", href: "/admin/students", icon: GraduationCap },
      { label: "Instructors", href: "/admin/instructors", icon: Users },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Enrollments", href: "/admin/enrollments", icon: TicketCheck },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/admin/settings", icon: Settings }],
  },
]

export const INSTRUCTOR_NAV: NavSection[] = [
  { items: [{ label: "Dashboard", href: "/instructor", icon: LayoutDashboard }] },
  {
    label: "Teaching",
    items: [
      { label: "My Courses", href: "/instructor/courses", icon: BookOpen },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
]

export const STUDENT_NAV: NavSection[] = [
  { items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    items: [
      { label: "My Program", href: "/dashboard/program", icon: School },
      { label: "My Courses", href: "/dashboard/my-courses", icon: BookOpen },
      { label: "Semesters", href: "/dashboard/bundles", icon: Boxes },
      { label: "Orders", href: "/dashboard/orders", icon: CreditCard },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Profile", href: "/dashboard/profile", icon: Users },
    ],
  },
]
