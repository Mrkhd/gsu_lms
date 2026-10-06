export type PaymentStatus = "PENDING" | "PAID" | "FAILED"

export type CheckoutInput = {
  orderId: string
  amount: number
  currency: string
  description: string
  customerEmail: string
  customerName: string
  returnUrl: string
}

export type CheckoutResult = {
  providerRef: string
  status: PaymentStatus
  /** When set, the customer should be redirected to complete payment. */
  redirectUrl?: string
}

/**
 * Payment abstraction. The MVP ships a `mock` provider; swap in Stripe/Paddle
 * (or any gateway) by implementing this interface and registering it in
 * `src/lib/payments/index.ts`. Nothing else in the app imports a provider SDK.
 */
export interface PaymentProvider {
  readonly name: string
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>
}
