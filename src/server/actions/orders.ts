"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { bundles, courses, orders } from "@/db/schema"
import { getCourseAccess } from "@/lib/access"
import { requireActionUser, requireActionRole } from "@/lib/auth/server"
import { fullName, toNumber } from "@/lib/format"
import { cancelOrder, checkoutOrder, createOrder, fulfillOrder, refundOrder } from "@/lib/orders"
import { failure, success, toActionError, type ActionState } from "@/lib/action-utils"

export type CheckoutResult = {
  orderId: string
  paid: boolean
  redirectTo: string
}

export async function checkoutAction(
  itemType: "COURSE" | "BUNDLE",
  itemId: string
): Promise<ActionState<CheckoutResult>> {
  const user = await requireActionUser()
  const db = getDb()

  try {
    if (itemType === "COURSE") {
      const [course] = await db
        .select()
        .from(courses)
        .where(and(eq(courses.id, itemId), eq(courses.status, "PUBLISHED")))
        .limit(1)
      if (!course) return failure("This course is not available for purchase.")

      const access = await getCourseAccess(user.id, course.id)
      if (access.hasAccess) {
        return success("You already have access to this course.", {
          orderId: "",
          paid: true,
          redirectTo: `/learn/${course.slug}`,
        })
      }

      const order = await createOrder(user.id, {
        type: "COURSE",
        course: {
          id: course.id,
          title: course.title,
          price: course.price,
          accessDurationDays: course.accessDurationDays,
        },
      })

      if (toNumber(course.price) <= 0) {
        await fulfillOrder(order.id)
        revalidatePath("/dashboard")
        return success("You are enrolled.", {
          orderId: order.id,
          paid: true,
          redirectTo: `/learn/${course.slug}`,
        })
      }

      const outcome = await checkoutOrder(order.id, { email: user.email, name: fullName(user) })
      revalidatePath("/dashboard/orders")
      if (outcome.status === "PAID") {
        revalidatePath("/dashboard")
        return success("Payment successful. Enjoy the course!", {
          orderId: order.id,
          paid: true,
          redirectTo: `/learn/${course.slug}`,
        })
      }
      if (outcome.status === "FAILED") return failure("Payment failed. Please try again.")
      return success("Complete your payment to unlock access.", {
        orderId: order.id,
        paid: false,
        redirectTo: outcome.redirectUrl ?? "/dashboard/orders",
      })
    }

    const [bundle] = await db
      .select()
      .from(bundles)
      .where(and(eq(bundles.id, itemId), eq(bundles.status, "PUBLISHED")))
      .limit(1)
    if (!bundle) return failure("This bundle is not available for purchase.")

    const order = await createOrder(user.id, {
      type: "BUNDLE",
      bundle: {
        id: bundle.id,
        title: bundle.title,
        price: bundle.price,
        accessDurationDays: bundle.accessDurationDays,
      },
    })

    if (toNumber(bundle.price) <= 0) {
      await fulfillOrder(order.id)
      revalidatePath("/dashboard")
      return success("You are enrolled.", {
        orderId: order.id,
        paid: true,
        redirectTo: "/dashboard/bundles",
      })
    }

    const outcome = await checkoutOrder(order.id, { email: user.email, name: fullName(user) })
    revalidatePath("/dashboard/orders")
    if (outcome.status === "PAID") {
      revalidatePath("/dashboard")
      return success("Payment successful. Enjoy your new courses!", {
        orderId: order.id,
        paid: true,
        redirectTo: "/dashboard/bundles",
      })
    }
    if (outcome.status === "FAILED") return failure("Payment failed. Please try again.")
    return success("Complete your payment to unlock access.", {
      orderId: order.id,
      paid: false,
      redirectTo: outcome.redirectUrl ?? "/dashboard/orders",
    })
  } catch (error) {
    return toActionError(error)
  }
}

export async function payOrderAction(orderId: string): Promise<ActionState> {
  const user = await requireActionUser()
  const db = getDb()
  try {
    const [order] = await db
      .select({ id: orders.id, studentId: orders.studentId, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)
    if (!order) return failure("Order not found.")
    if (order.studentId !== user.id && user.role !== "ADMIN") {
      return failure("You do not have permission to pay this order.")
    }
    if (order.status === "PAID") return success("This order is already paid.")

    const outcome = await checkoutOrder(order.id, { email: user.email, name: fullName(user) })
    revalidatePath("/dashboard/orders")
    revalidatePath("/dashboard")
    if (outcome.status === "PAID") return success("Payment successful.")
    if (outcome.status === "FAILED") return failure("Payment failed. Please try again.")
    return success("Payment is pending.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function refundOrderAction(orderId: string): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    await refundOrder(orderId)
    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath("/dashboard")
    return success("Order refunded and access revoked.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function cancelOrderAction(orderId: string): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    await cancelOrder(orderId)
    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)
    return success("Order cancelled.")
  } catch (error) {
    return toActionError(error)
  }
}
