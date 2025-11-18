/**
 * Analytics Adapter Interface
 *
 * Abstract analytics/event tracking to support multiple providers:
 * - Stub (for development)
 * - PostHog
 * - Mixpanel
 * - Amplitude
 * - Google Analytics
 */

export interface AnalyticsEvent {
  event: string
  userId?: string
  properties?: Record<string, any>
  timestamp?: Date
}

export interface AnalyticsUser {
  userId: string
  properties?: Record<string, any>
}

export interface IAnalyticsAdapter {
  track(event: AnalyticsEvent): Promise<void>
  identify(user: AnalyticsUser): Promise<void>
  page(userId?: string, pageName?: string, properties?: Record<string, any>): Promise<void>
}

/**
 * Stub Analytics Adapter (for development)
 */
export class StubAnalyticsAdapter implements IAnalyticsAdapter {
  private events: AnalyticsEvent[] = []

  async track(event: AnalyticsEvent): Promise<void> {
    console.log('📊 [Analytics] Track:', event.event, event.properties)
    this.events.push({
      ...event,
      timestamp: event.timestamp || new Date(),
    })
  }

  async identify(user: AnalyticsUser): Promise<void> {
    console.log('📊 [Analytics] Identify:', user.userId, user.properties)
  }

  async page(userId?: string, pageName?: string, properties?: Record<string, any>): Promise<void> {
    console.log('📊 [Analytics] Page:', pageName, { userId, ...properties })
  }

  // Test helper
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  clearEvents(): void {
    this.events = []
  }
}

// Default adapter
let analyticsAdapter: IAnalyticsAdapter = new StubAnalyticsAdapter()

export function setAnalyticsAdapter(adapter: IAnalyticsAdapter): void {
  analyticsAdapter = adapter
}

export function getAnalyticsAdapter(): IAnalyticsAdapter {
  return analyticsAdapter
}

// Convenience functions
export async function trackEvent(event: string, properties?: Record<string, any>, userId?: string): Promise<void> {
  return analyticsAdapter.track({ event, properties, userId })
}

export async function identifyUser(userId: string, properties?: Record<string, any>): Promise<void> {
  return analyticsAdapter.identify({ userId, properties })
}
