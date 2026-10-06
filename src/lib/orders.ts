import { and, eq, inArray, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import {
  bundleCourses,
  bundles,
  courses,
  enrollments,
  bundleEnrollments,
  notifications,
  orderItems,
  orders,
  programSemesters,
  profiles,
  users,
} from "@/db/schema"
import {
  grantBundleAccess,
  grantCourseEnrollment,
  grantProgramEnrollment,
} from "@/lib/access"
import { toNumber } from "@/lib/format"
import { getPaymentProvider } from "@/lib/payments"

export type CartProduct =
  | { type: "COURSE"; course: { id: string; title: string; price: number; accessDurationDays: number | null } }
  | { type: "BUNDLE"; bundle: { id: string; title: string; price: number; accessDurationDays: number | null } }

async function nextOrderNumber(): Promise<number> {
  const db = getDb()
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${orders.number}), 10000)` })
    .from(orders)
  return Number(row?.max ?? 10000) + 1
}

export async function createOrder(studentId: string, product: CartProduct) {
  const db = getDb()
  const price =
    product.type === "COURSE" ? toNumber(product.course.price) : toNumber(product.bundle.price)
  const title = product.type === "COURSE" ? product.course.title : product.bundle.title

  const [order] = await db
    .insert(orders)
    .values({
      number: await nextOrderNumber(),
      studentId,
      subtotal: price,
      discount: 0,
      total: price,
      currency: "USD",
      status: "PENDING",
    })
    .returning()

  await db.insert(orderItems).values({
    orderId: order.id,
    itemType: product.type,
    courseId: product.type === "COURSE" ? product.course.id : null,
    bundleId: product.type === "BUNDLE" ? product.bundle.id : null,
    title,
    unitPrice: price,
    quantity: 1,
    totalPrice: price,
  })

  return order
}

export async function getOrderWithItems(orderId: string) {
  const db = getDb()
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return null

  const [student] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, order.studentId))
    .limit(1)

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))

  const courseIds = items.map((i) => i.courseId).filter((id): id is string => Boolean(id))
  const bundleIds = items.map((i) => i.bundleId).filter((id): id is string => Boolean(id))

  const courseRows = courseIds.length
    ? await db
        .select({
          id: courses.id,
          slug: courses.slug,
          title: courses.title,
          accessDurationDays: courses.accessDurationDays,
        })
        .from(courses)
        .where(inArray(courses.id, courseIds))
    : []
  const bundleRows = bundleIds.length
    ? await db
        .select({
          id: bundles.id,
          slug: bundles.slug,
          title: bundles.title,
          accessDurationDays: bundles.accessDurationDays,
        })
        .from(bundles)
        .where(inArray(bundles.id, bundleIds))
    : []
  const bundleLinks = bundleIds.length
    ? await db
        .select({ bundleId: bundleCourses.bundleId, courseId: bundleCourses.courseId })
        .from(bundleCourses)
        .where(inArray(bundleCourses.bundleId, bundleIds))
    : []

  const courseMap = new Map(courseRows.map((c) => [c.id, c]))
  const bundleMap = new Map(bundleRows.map((b) => [b.id, b]))

  return {
    ...order,
    student: {
      id: student?.id ?? order.studentId,
      email: student?.email ?? "",
      profile: student
        ? { firstName: student.firstName, lastName: student.lastName, avatarUrl: student.avatarUrl }
        : null,
    },
    items: items.map((item) => {
      const bundle = item.bundleId ? bundleMap.get(item.bundleId) : undefined
      return {
        ...item,
        course: item.courseId ? courseMap.get(item.courseId) ?? null : null,
        bundle: bundle
          ? {
              ...bundle,
              courses: bundleLinks
                .filter((link) => link.bundleId === item.bundleId)
                .map((link) => ({ courseId: link.courseId })),
            }
          : null,
      }
    }),
  }
}

export type FulfillResult = { alreadyPaid: boolean }

/**
 * Marks an order paid and provisions access. Idempotent: safe to call twice.
 * Note: D1 has no transactions, so steps run sequentially.
 */
export async function fulfillOrder(orderId: string): Promise<FulfillResult> {
  const db = getDb()
  const order = await getOrderWithItems(orderId)
  if (!order) throw new Error("Order not found.")
  if (order.status === "PAID") return { alreadyPaid: true }

  await db
    .update(orders)
    .set({ status: "PAID", paidAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, order.id))

  for (const item of order.items) {
    if (item.itemType === "COURSE" && item.course) {
      await grantCourseEnrollment({
        studentId: order.studentId,
        courseId: item.course.id,
        source: "DIRECT_PURCHASE",
        sourceId: order.id,
        accessDurationDays: item.course.accessDurationDays ?? null,
      })
    } else if (item.itemType === "BUNDLE" && item.bundle) {
      await grantBundleAccess({
        studentId: order.studentId,
        bundleId: item.bundle.id,
        courseIds: item.bundle.courses.map((c) => c.courseId),
        source: "BUNDLE_PURCHASE",
        sourceId: order.id,
        accessDurationDays: item.bundle.accessDurationDays ?? null,
      })

      const [semester] = await db
        .select({ programId: programSemesters.programId, number: programSemesters.number })
        .from(programSemesters)
        .where(eq(programSemesters.bundleId, item.bundle.id))
        .limit(1)
      if (semester) {
        await grantProgramEnrollment({
          studentId: order.studentId,
          programId: semester.programId,
          currentSemester: semester.number,
        })
      }
    }
  }

  await db.insert(notifications).values({
    userId: order.studentId,
    title: "Purchase complete",
    body: "Your new access is ready. Head to your dashboard to start learning.",
  })

  return { alreadyPaid: false }
}

export type CheckoutOutcome = {
  status: "PAID" | "PENDING" | "FAILED"
  redirectUrl?: string
}

export async function checkoutOrder(
  orderId: string,
  customer: { email: string; name: string }
): Promise<CheckoutOutcome> {
  const db = getDb()
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) throw new Error("Order not found.")
  if (order.status === "PAID") return { status: "PAID" }
  if (order.status === "REFUNDED" || order.status === "CANCELLED") {
    throw new Error("This order can no longer be paid.")
  }

  const provider = getPaymentProvider()
  const result = await provider.createCheckout({
    orderId: order.id,
    amount: toNumber(order.total),
    currency: order.currency,
    description: `Order ${order.number}`,
    customerEmail: customer.email,
    customerName: customer.name,
    returnUrl: `/dashboard/orders`,
  })

  if (result.status === "PAID") {
    await fulfillOrder(order.id)
    return { status: "PAID" }
  }

  if (result.status === "FAILED") {
    await db
      .update(orders)
      .set({ status: "FAILED", provider: provider.name, providerRef: result.providerRef, updatedAt: new Date() })
      .where(eq(orders.id, order.id))
    return { status: "FAILED" }
  }

  await db
    .update(orders)
    .set({ status: "PENDING", provider: provider.name, providerRef: result.providerRef, updatedAt: new Date() })
    .where(eq(orders.id, order.id))
  return { status: "PENDING", redirectUrl: result.redirectUrl }
}

export async function refundOrder(orderId: string) {
  const db = getDb()
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) throw new Error("Order not found.")
  if (order.status !== "PAID") throw new Error("Only paid orders can be refunded.")

  await db.update(orders).set({ status: "REFUNDED", updatedAt: new Date() }).where(eq(orders.id, orderId))
  await db
    .update(enrollments)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(and(eq(enrollments.sourceId, orderId), inArray(enrollments.source, ["DIRECT_PURCHASE", "BUNDLE_PURCHASE"])))
  await db
    .update(bundleEnrollments)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(eq(bundleEnrollments.sourceId, orderId))
}

export async function cancelOrder(orderId: string) {
  const db = getDb()
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) throw new Error("Order not found.")
  if (order.status === "PAID") throw new Error("Paid orders cannot be cancelled — refund instead.")
  await db.update(orders).set({ status: "CANCELLED", updatedAt: new Date() }).where(eq(orders.id, orderId))
}
