/**
 * Metrics collection utility
 *
 * In production, integrate with DataDog, Prometheus, CloudWatch, etc.
 * For now, provides a simple interface that can be extended
 */

interface MetricLabels {
  [key: string]: string | number | boolean
}

interface Metric {
  name: string
  value: number
  labels?: MetricLabels
  timestamp: Date
}

class MetricsCollector {
  private metrics: Metric[] = []
  private readonly maxMetrics = 1000 // Prevent memory leaks in dev

  /**
   * Record a counter increment
   */
  recordCounter(name: string, value: number = 1, labels?: MetricLabels) {
    this.record(name, value, labels)

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Counter: ${name} = ${value}`, labels || '')
    }
  }

  /**
   * Record a gauge value
   */
  recordGauge(name: string, value: number, labels?: MetricLabels) {
    this.record(name, value, labels)

    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 Gauge: ${name} = ${value}`, labels || '')
    }
  }

  /**
   * Record timing/duration in milliseconds
   */
  recordTiming(name: string, durationMs: number, labels?: MetricLabels) {
    this.record(`${name}.duration_ms`, durationMs, labels)

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️  Timing: ${name} = ${durationMs}ms`, labels || '')
    }
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels) {
    this.record(name, value, labels)

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Histogram: ${name} = ${value}`, labels || '')
    }
  }

  private record(name: string, value: number, labels?: MetricLabels) {
    const metric: Metric = {
      name,
      value,
      labels,
      timestamp: new Date(),
    }

    this.metrics.push(metric)

    // Prevent memory leaks in long-running dev servers
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // In production, send to your metrics backend
    if (process.env.NODE_ENV === 'production') {
      this.sendToBackend(metric)
    }
  }

  private sendToBackend(metric: Metric) {
    // TODO: Integrate with your metrics backend
    // Examples:
    // - DataDog: https://docs.datadoghq.com/api/latest/metrics/
    // - Prometheus: Push to pushgateway
    // - CloudWatch: Use AWS SDK
    // - PostHog: Use posthog.capture()
  }

  /**
   * Get all recorded metrics (for debugging/testing)
   */
  getMetrics(): Metric[] {
    return [...this.metrics]
  }

  /**
   * Clear all recorded metrics
   */
  clear() {
    this.metrics = []
  }
}

// Singleton instance
export const metrics = new MetricsCollector()

/**
 * Helper to measure execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: MetricLabels
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    metrics.recordTiming(name, duration, { ...labels, status: 'success' })
    return result
  } catch (error) {
    const duration = Date.now() - start
    metrics.recordTiming(name, duration, { ...labels, status: 'error' })
    throw error
  }
}

/**
 * Helper to measure synchronous execution time
 */
export function measure<T>(
  name: string,
  fn: () => T,
  labels?: MetricLabels
): T {
  const start = Date.now()
  try {
    const result = fn()
    const duration = Date.now() - start
    metrics.recordTiming(name, duration, { ...labels, status: 'success' })
    return result
  } catch (error) {
    const duration = Date.now() - start
    metrics.recordTiming(name, duration, { ...labels, status: 'error' })
    throw error
  }
}

// Common metric names (constants for consistency)
export const MetricNames = {
  // HTTP
  HTTP_REQUEST: 'http.request',
  HTTP_REQUEST_DURATION: 'http.request.duration',
  HTTP_ERROR: 'http.error',

  // Auth
  AUTH_LOGIN: 'auth.login',
  AUTH_SIGNUP: 'auth.signup',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_FAILED: 'auth.failed',

  // Database
  DB_QUERY: 'db.query',
  DB_QUERY_DURATION: 'db.query.duration',
  DB_ERROR: 'db.error',

  // Business
  USER_CREATED: 'user.created',
  ORGANIZATION_CREATED: 'organization.created',
  INVITATION_SENT: 'invitation.sent',
  SUBSCRIPTION_CREATED: 'subscription.created',
  API_KEY_CREATED: 'api_key.created',
} as const
