import { AsyncLocalStorage } from 'node:async_hooks'

export const correlationContext = new AsyncLocalStorage<string>()

export function getActiveCorrelationId(): string | undefined {
  return correlationContext.getStore()
}
