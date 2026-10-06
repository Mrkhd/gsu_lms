import { env } from "@/lib/env"
import { MockPaymentProvider } from "./mock"
import type { PaymentProvider } from "./types"

const providers: Record<string, PaymentProvider> = {
  mock: new MockPaymentProvider(),
}

let cached: PaymentProvider | null = null

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached
  cached = providers[env.PAYMENT_PROVIDER] ?? providers.mock
  return cached
}

export type { CheckoutInput, CheckoutResult, PaymentProvider, PaymentStatus } from "./types"
