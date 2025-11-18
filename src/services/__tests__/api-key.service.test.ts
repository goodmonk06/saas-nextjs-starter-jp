import { describe, it, expect, beforeEach, vi } from "vitest"
import { ApiKeyService } from "../api-key.service"

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock event bus
vi.mock("@/lib/events/bus", () => ({
  eventBus: {
    emit: vi.fn(),
  },
  createEvent: vi.fn((event) => event),
}))

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}))

// Mock metrics
vi.mock("@/lib/metrics", () => ({
  metrics: {
    recordCounter: vi.fn(),
  },
  MetricNames: {
    API_KEY_CREATED: "api_key.created",
  },
}))

describe("ApiKeyService", () => {
  let service: ApiKeyService

  beforeEach(() => {
    service = new ApiKeyService()
    vi.clearAllMocks()
  })

  describe("create", () => {
    it("should create API key with hashed key", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockApiKey = {
        id: "key-1",
        name: "Test Key",
        prefix: "sk_abc123",
        key: "hashed-key",
        userId: "user-1",
        organizationId: null,
        scopes: [],
        expiresAt: null,
        user: {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
        },
        organization: null,
      }

      vi.mocked(prisma.apiKey.create).mockResolvedValue(mockApiKey as any)

      const result = await service.create({
        name: "Test Key",
        userId: "user-1",
      })

      expect(result).toHaveProperty("key")
      expect(result.key).toMatch(/^sk_/)
      expect(result.name).toBe("Test Key")
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Test Key",
          userId: "user-1",
          scopes: [],
        }),
        include: expect.any(Object),
      })
    })

    it("should throw error if neither userId nor organizationId provided", async () => {
      await expect(
        service.create({
          name: "Test Key",
        })
      ).rejects.toThrow("ユーザーIDまたは組織IDが必要です")
    })

    it("should set expiration date when expiresInDays provided", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockApiKey = {
        id: "key-1",
        name: "Test Key",
        prefix: "sk_abc123",
        key: "hashed-key",
        userId: "user-1",
        scopes: [],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      vi.mocked(prisma.apiKey.create).mockResolvedValue(mockApiKey as any)

      const result = await service.create({
        name: "Test Key",
        userId: "user-1",
        expiresInDays: 7,
      })

      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
        include: expect.any(Object),
      })
    })
  })

  describe("validate", () => {
    it("should return valid for correct API key", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockApiKey = {
        id: "key-1",
        key: "hashed-key",
        revokedAt: null,
        expiresAt: null,
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
          plan: "FREE",
        },
      }

      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(mockApiKey as any)
      vi.mocked(prisma.apiKey.update).mockResolvedValue(mockApiKey as any)

      const result = await service.validate("test-key")

      expect(result.valid).toBe(true)
      expect(result.apiKey).toBeDefined()
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: "key-1" },
        data: { lastUsedAt: expect.any(Date) },
      })
    })

    it("should return invalid for revoked key", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockApiKey = {
        id: "key-1",
        key: "hashed-key",
        revokedAt: new Date(),
        expiresAt: null,
      }

      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(mockApiKey as any)

      const result = await service.validate("test-key")

      expect(result.valid).toBe(false)
      expect(result.reason).toBe("API key has been revoked")
    })

    it("should return invalid for expired key", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockApiKey = {
        id: "key-1",
        key: "hashed-key",
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000), // Expired
      }

      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(mockApiKey as any)

      const result = await service.validate("test-key")

      expect(result.valid).toBe(false)
      expect(result.reason).toBe("API key has expired")
    })

    it("should return invalid for non-existent key", async () => {
      const { prisma } = await import("@/lib/prisma")
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null)

      const result = await service.validate("test-key")

      expect(result.valid).toBe(false)
      expect(result.reason).toBe("Invalid API key")
    })
  })

  describe("revoke", () => {
    it("should revoke API key", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockApiKey = {
        id: "key-1",
        revokedAt: new Date(),
      }

      vi.mocked(prisma.apiKey.update).mockResolvedValue(mockApiKey as any)

      await service.revoke("key-1", "user-1")

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: "key-1" },
        data: { revokedAt: expect.any(Date) },
      })
    })
  })
})
