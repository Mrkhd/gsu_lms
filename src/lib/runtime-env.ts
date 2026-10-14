/**
 * Reads a runtime configuration value from the process environment.
 *
 * On a VPS these come from `.env` / the systemd unit's `EnvironmentFile`.
 */
export function readEnv(key: string, fallback?: string): string | undefined {
  const value = process.env[key]
  return value ?? fallback
}
