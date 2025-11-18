import { describe, it, expect, beforeEach, vi } from "vitest"
import { EventBus, createEvent } from "../bus"
import type { DomainEvent } from "../types"

describe("EventBus", () => {
  let eventBus: EventBus

  beforeEach(() => {
    eventBus = new EventBus()
    eventBus.clear()
  })

  describe("on", () => {
    it("should register event handler", () => {
      const handler = vi.fn()
      eventBus.on("user.created", handler)

      expect(eventBus.getEventTypes()).toContain("user.created")
      expect(eventBus.getHandlerCount("user.created")).toBe(1)
    })

    it("should register multiple handlers for same event", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on("user.created", handler1)
      eventBus.on("user.created", handler2)

      expect(eventBus.getHandlerCount("user.created")).toBe(2)
    })

    it("should register handler for multiple event types", () => {
      const handler = vi.fn()
      eventBus.on(["user.created", "user.updated"], handler)

      expect(eventBus.getEventTypes()).toContain("user.created")
      expect(eventBus.getEventTypes()).toContain("user.updated")
    })
  })

  describe("emit", () => {
    it("should call registered handlers", async () => {
      const handler = vi.fn()
      eventBus.on("user.created", handler)

      const event: DomainEvent = {
        type: "user.created",
        userId: "123",
        email: "test@example.com",
        timestamp: new Date(),
      }

      await eventBus.emit(event)

      expect(handler).toHaveBeenCalledWith(event)
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it("should call multiple handlers", async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on("user.created", handler1)
      eventBus.on("user.created", handler2)

      const event: DomainEvent = {
        type: "user.created",
        userId: "123",
        email: "test@example.com",
        timestamp: new Date(),
      }

      await eventBus.emit(event)

      expect(handler1).toHaveBeenCalledWith(event)
      expect(handler2).toHaveBeenCalledWith(event)
    })

    it("should handle async handlers", async () => {
      const handler = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      eventBus.on("user.created", handler)

      const event: DomainEvent = {
        type: "user.created",
        userId: "123",
        email: "test@example.com",
        timestamp: new Date(),
      }

      await eventBus.emit(event)

      expect(handler).toHaveBeenCalled()
    })

    it("should not throw if handler fails", async () => {
      const failingHandler = vi.fn(() => {
        throw new Error("Handler error")
      })
      const successHandler = vi.fn()

      eventBus.on("user.created", failingHandler)
      eventBus.on("user.created", successHandler)

      const event: DomainEvent = {
        type: "user.created",
        userId: "123",
        email: "test@example.com",
        timestamp: new Date(),
      }

      // Should not throw
      await expect(eventBus.emit(event)).resolves.not.toThrow()

      // Both handlers should have been called
      expect(failingHandler).toHaveBeenCalled()
      expect(successHandler).toHaveBeenCalled()
    })

    it("should not call handlers for unregistered events", async () => {
      const handler = vi.fn()
      eventBus.on("user.created", handler)

      const event: DomainEvent = {
        type: "user.updated",
        userId: "123",
        data: {},
        timestamp: new Date(),
      }

      await eventBus.emit(event)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe("off", () => {
    it("should remove all handlers for event type", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventBus.on("user.created", handler1)
      eventBus.on("user.created", handler2)

      eventBus.off("user.created")

      expect(eventBus.getHandlerCount("user.created")).toBe(0)
    })
  })

  describe("clear", () => {
    it("should remove all handlers", () => {
      eventBus.on("user.created", vi.fn())
      eventBus.on("user.updated", vi.fn())

      expect(eventBus.getEventTypes().length).toBeGreaterThan(0)

      eventBus.clear()

      expect(eventBus.getEventTypes().length).toBe(0)
    })
  })

  describe("getEventTypes", () => {
    it("should return all registered event types", () => {
      eventBus.on("user.created", vi.fn())
      eventBus.on("user.updated", vi.fn())
      eventBus.on("organization.created", vi.fn())

      const types = eventBus.getEventTypes()

      expect(types).toContain("user.created")
      expect(types).toContain("user.updated")
      expect(types).toContain("organization.created")
      expect(types.length).toBe(3)
    })
  })

  describe("getHandlerCount", () => {
    it("should return handler count for event type", () => {
      eventBus.on("user.created", vi.fn())
      eventBus.on("user.created", vi.fn())
      eventBus.on("user.updated", vi.fn())

      expect(eventBus.getHandlerCount("user.created")).toBe(2)
      expect(eventBus.getHandlerCount("user.updated")).toBe(1)
      expect(eventBus.getHandlerCount("nonexistent")).toBe(0)
    })
  })
})

describe("createEvent", () => {
  it("should add timestamp to event", () => {
    const event = createEvent({
      type: "user.created",
      userId: "123",
      email: "test@example.com",
    } as any)

    expect(event).toHaveProperty("timestamp")
    expect(event.timestamp).toBeInstanceOf(Date)
    expect(event.type).toBe("user.created")
    expect(event.userId).toBe("123")
  })

  it("should preserve existing properties", () => {
    const event = createEvent({
      type: "organization.created",
      organizationId: "org-1",
      name: "Test Org",
      slug: "test-org",
      createdBy: "user-1",
    } as any)

    expect(event.organizationId).toBe("org-1")
    expect(event.name).toBe("Test Org")
    expect(event.slug).toBe("test-org")
    expect(event.createdBy).toBe("user-1")
  })
})
