import { z } from "zod"

import { readEnv } from "./cf-env"

/**
 * Environment configuration, validated with Zod.
 *
 * Values come from Cloudflare bindings/secrets at runtime (see `cf-env.ts`),
 * with sensible development defaults so tooling can run without full config.
 */
const envSchema = z.object({
  SESSION_SECRET: z
    .string()
    .min(16)
    .default("dev-only-secret-please-change-me-in-production-0123456789abcdef"),
  PAYMENT_PROVIDER: z.enum(["mock"]).default("mock"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

export const env = envSchema.parse({
  SESSION_SECRET: readEnv("SESSION_SECRET"),
  PAYMENT_PROVIDER: readEnv("PAYMENT_PROVIDER"),
  NEXT_PUBLIC_APP_URL: readEnv("NEXT_PUBLIC_APP_URL"),
  NODE_ENV: readEnv("NODE_ENV"),
})

export const isProduction = env.NODE_ENV === "production"
