/**
 * Event Bus
 *
 * Simple in-memory event bus for domain events
 * In production, consider using a message queue (Redis, RabbitMQ, AWS SQS, etc.)
 */

import { DomainEvent } from './types'
import { logger } from '../logger'

type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map()

  /**
   * Register an event handler
   */
  on<T extends DomainEvent>(
    eventType: T['type'] | T['type'][],
    handler: EventHandler<T>
  ): void {
    const types = Array.isArray(eventType) ? eventType : [eventType]

    types.forEach((type) => {
      const existing = this.handlers.get(type) || []
      this.handlers.set(type, [...existing, handler as EventHandler])
    })
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) || []

    logger.debug(`Event emitted: ${event.type}`, {
      eventType: event.type,
      handlerCount: handlers.length,
    })

    // Execute all handlers in parallel
    const results = await Promise.allSettled(
      handlers.map((handler) => Promise.resolve(handler(event)))
    )

    // Log any handler failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`Event handler failed for ${event.type}`, result.reason, {
          eventType: event.type,
          handlerIndex: index,
        })
      }
    })
  }

  /**
   * Remove all handlers for an event type
   */
  off(eventType: string): void {
    this.handlers.delete(eventType)
  }

  /**
   * Remove all handlers
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Get handler count for an event type
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0
  }
}

// Singleton instance
export const eventBus = new EventBus()

// Helper to create events with common fields
export function createEvent<T extends DomainEvent>(
  event: Omit<T, 'timestamp'>
): T {
  return {
    ...event,
    timestamp: new Date(),
  } as T
}
