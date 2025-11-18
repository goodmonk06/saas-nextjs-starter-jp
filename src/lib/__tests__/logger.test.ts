import { describe, it, expect, beforeEach, vi } from "vitest"
import { Logger } from "../logger"

describe("Logger", () => {
  let logger: Logger
  let consoleSpy: any

  beforeEach(() => {
    logger = new Logger()
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe("info", () => {
    it("should log info message", () => {
      logger.info("Test message")
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("INFO"),
        expect.stringContaining("Test message")
      )
    })

    it("should log with metadata", () => {
      logger.info("Test message", { userId: "123" })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("INFO"),
        expect.stringContaining("Test message"),
        expect.objectContaining({ userId: "123" })
      )
    })
  })

  describe("error", () => {
    it("should log error message", () => {
      const error = new Error("Test error")
      logger.error("Error occurred", error)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("ERROR"),
        expect.stringContaining("Error occurred"),
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Test error",
            name: "Error",
          }),
        })
      )
    })
  })

  describe("child", () => {
    it("should create child logger with context", () => {
      const childLogger = logger.child({ service: "TestService" })
      childLogger.info("Child message")

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("INFO"),
        expect.stringContaining("Child message"),
        expect.objectContaining({ service: "TestService" })
      )
    })

    it("should merge parent and child context", () => {
      const childLogger = logger.child({ service: "TestService" })
      childLogger.info("Test", { userId: "123" })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          service: "TestService",
          userId: "123",
        })
      )
    })
  })

  describe("debug", () => {
    it("should log debug message in development", () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = "development"

      logger.debug("Debug message")
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("DEBUG"),
        expect.stringContaining("Debug message")
      )

      process.env.NODE_ENV = originalEnv
    })
  })

  describe("warn", () => {
    it("should log warning message", () => {
      logger.warn("Warning message")
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("WARN"),
        expect.stringContaining("Warning message")
      )
    })
  })
})
