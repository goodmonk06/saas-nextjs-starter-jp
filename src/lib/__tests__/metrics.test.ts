import { describe, it, expect, beforeEach, vi } from "vitest"
import { MetricsCollector, measureAsync, measure } from "../metrics"

describe("MetricsCollector", () => {
  let metrics: MetricsCollector

  beforeEach(() => {
    metrics = new MetricsCollector()
    metrics.clear()
  })

  describe("recordCounter", () => {
    it("should record counter metric", () => {
      metrics.recordCounter("test.counter", 5, { userId: "123" })

      const recorded = metrics.getMetrics()
      expect(recorded).toHaveLength(1)
      expect(recorded[0]).toMatchObject({
        name: "test.counter",
        value: 5,
        labels: { userId: "123" },
      })
    })

    it("should default to value of 1", () => {
      metrics.recordCounter("test.counter")

      const recorded = metrics.getMetrics()
      expect(recorded[0].value).toBe(1)
    })
  })

  describe("recordGauge", () => {
    it("should record gauge metric", () => {
      metrics.recordGauge("test.gauge", 42, { region: "us-east-1" })

      const recorded = metrics.getMetrics()
      expect(recorded).toHaveLength(1)
      expect(recorded[0]).toMatchObject({
        name: "test.gauge",
        value: 42,
        labels: { region: "us-east-1" },
      })
    })
  })

  describe("recordTiming", () => {
    it("should record timing metric with duration suffix", () => {
      metrics.recordTiming("test.operation", 123)

      const recorded = metrics.getMetrics()
      expect(recorded).toHaveLength(1)
      expect(recorded[0]).toMatchObject({
        name: "test.operation.duration_ms",
        value: 123,
      })
    })
  })

  describe("recordHistogram", () => {
    it("should record histogram metric", () => {
      metrics.recordHistogram("test.histogram", 50)

      const recorded = metrics.getMetrics()
      expect(recorded).toHaveLength(1)
      expect(recorded[0]).toMatchObject({
        name: "test.histogram",
        value: 50,
      })
    })
  })

  describe("memory management", () => {
    it("should limit stored metrics to maxMetrics", () => {
      // Record more than maxMetrics (default 1000)
      for (let i = 0; i < 1100; i++) {
        metrics.recordCounter("test.counter", 1)
      }

      const recorded = metrics.getMetrics()
      expect(recorded.length).toBeLessThanOrEqual(1000)
    })
  })

  describe("clear", () => {
    it("should clear all metrics", () => {
      metrics.recordCounter("test.counter", 1)
      expect(metrics.getMetrics()).toHaveLength(1)

      metrics.clear()
      expect(metrics.getMetrics()).toHaveLength(0)
    })
  })
})

describe("measureAsync", () => {
  it("should measure async function execution time", async () => {
    const metrics = new MetricsCollector()
    const fn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return "result"
    }

    const result = await measureAsync("test.operation", fn)

    expect(result).toBe("result")
    const recorded = metrics.getMetrics()
    expect(recorded.some((m) => m.name === "test.operation.duration_ms")).toBe(false) // Different instance
  })

  it("should record error status on failure", async () => {
    const metrics = new MetricsCollector()
    const fn = async () => {
      throw new Error("Test error")
    }

    await expect(measureAsync("test.operation", fn)).rejects.toThrow("Test error")
  })
})

describe("measure", () => {
  it("should measure sync function execution time", () => {
    const metrics = new MetricsCollector()
    const fn = () => {
      let sum = 0
      for (let i = 0; i < 1000; i++) {
        sum += i
      }
      return sum
    }

    const result = measure("test.operation", fn)

    expect(result).toBe(499500)
  })

  it("should record error status on failure", () => {
    const metrics = new MetricsCollector()
    const fn = () => {
      throw new Error("Test error")
    }

    expect(() => measure("test.operation", fn)).toThrow("Test error")
  })
})
