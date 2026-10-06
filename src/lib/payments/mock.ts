import type { CheckoutInput, CheckoutResult, PaymentProvider } from "./types"

/**
 * Mock provider: approves every checkout immediately. Useful for local
 * development and demos. No external network calls are made.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock"

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    return {
      providerRef: `mock_${input.orderId}_${Date.now()}`,
      status: "PAID",
    }
  }
}
