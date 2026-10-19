import { z } from "zod"

import { readEnv } from "./runtime-env"

/**
 * Environment configuration, validated with Zod.
 *
 * Values come from the process environment at runtime (see `runtime-env.ts`),
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
  RESEND_API_KEY: z.string().optional(),
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  EMAIL_FROM: z.string().default("GSU Postgraduate <onboarding@resend.dev>"),
  EMAIL_DOMAIN: z.string().default("postgrad.galmudugsu.edu.so"),
})

export const env = envSchema.parse({
  SESSION_SECRET: readEnv("SESSION_SECRET"),
  PAYMENT_PROVIDER: readEnv("PAYMENT_PROVIDER"),
  NEXT_PUBLIC_APP_URL: readEnv("NEXT_PUBLIC_APP_URL"),
  NODE_ENV: readEnv("NODE_ENV"),
  RESEND_API_KEY: readEnv("RESEND_API_KEY"),
  RESEND_WEBHOOK_SECRET: readEnv("RESEND_WEBHOOK_SECRET"),
  EMAIL_FROM: readEnv("EMAIL_FROM"),
  EMAIL_DOMAIN: readEnv("EMAIL_DOMAIN"),
})

export const isProduction = env.NODE_ENV === "production"
