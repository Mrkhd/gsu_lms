declare module "cloudflare:workers" {
  import type { D1Database, R2Bucket } from "@cloudflare/workers-types"

  export const env: {
    DB: D1Database
    BUCKET: R2Bucket
    SESSION_SECRET?: string
    NEXT_PUBLIC_APP_URL?: string
    PAYMENT_PROVIDER?: string
  }
}
