import { getActiveCorrelationId } from '@/lib/observability/correlation-store'

export type LogLevel = 'info' | 'warn' | 'error'
const isProduction = process.env.NODE_ENV === 'production'
const verboseLogsEnabled = process.env.LOG_LEVEL?.toLowerCase() === 'debug'

const SENSITIVE_KEY_SUBSTRINGS = [
  'password',
  'secret',
  'token',
  'authorization',
  'cookie',
  'email',
  'phone',
  'credit',
  'ssn',
  'apikey',
  'api_key',
]

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase()
  return SENSITIVE_KEY_SUBSTRINGS.some((s) => k.includes(s))
}

/**
 * Shallow redaction for log metadata. Nested objects are replaced with a placeholder if any key is sensitive.
 */
export function redactMeta(
  meta: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!meta) return undefined
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(meta)) {
    if (isSensitiveKey(key)) {
      out[key] = '[REDACTED]'
      continue
    }
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      out[key] = '[Object]'
      continue
    }
    out[key] = value
  }
  return out
}

function writeLine(level: LogLevel, line: string): void {
  if (typeof process !== 'undefined' && process.stdout && process.stderr) {
    if (level === 'error') {
      process.stderr.write(`${line}\n`)
    } else {
      process.stdout.write(`${line}\n`)
    }
  }
}

function coerceLogMeta(meta?: unknown): Record<string, unknown> | undefined {
  if (meta === undefined || meta === null) return undefined
  if (meta instanceof Error) {
    return { errorMessage: meta.message, errorName: meta.name }
  }
  if (typeof meta === 'object' && !Array.isArray(meta)) {
    return { ...(meta as Record<string, unknown>) }
  }
  return { detail: String(meta) }
}

function emit(scope: string, level: LogLevel, message: string, meta?: unknown): void {
  // Keep production logs lean by default.
  if (isProduction && level === 'info' && !verboseLogsEnabled) {
    return
  }
  const flat = coerceLogMeta(meta)
  const correlationId = getActiveCorrelationId()
  const payload = {
    level,
    scope,
    message,
    time: new Date().toISOString(),
    ...(correlationId ? { correlationId } : {}),
    ...(redactMeta(flat) ?? {}),
  }
  writeLine(level, JSON.stringify(payload))
}

export function createLogger(scope: string) {
  return {
    info(message: string, meta?: unknown): void {
      emit(scope, 'info', message, meta)
    },
    warn(message: string, meta?: unknown): void {
      emit(scope, 'warn', message, meta)
    },
    error(message: string, meta?: unknown): void {
      emit(scope, 'error', message, meta)
    },
  }
}

export type Logger = ReturnType<typeof createLogger>
