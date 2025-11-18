import { describe, it, expect, beforeEach, vi } from "vitest"
import { OrganizationService } from "../organization.service"
import { MemberRole } from "@prisma/client"

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    organizationMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
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
    ORGANIZATION_CREATED: "organization.created",
  },
}))

describe("OrganizationService", () => {
  let service: OrganizationService

  beforeEach(() => {
    service = new OrganizationService()
    vi.clearAllMocks()
  })

  describe("create", () => {
    it("should create organization with creator as OWNER", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockOrganization = {
        id: "org-1",
        name: "Test Org",
        slug: "test-org",
        description: "Test Description",
        createdBy: "user-1",
        members: [
          {
            id: "member-1",
            role: MemberRole.OWNER,
            userId: "user-1",
            user: {
              id: "user-1",
              name: "Test User",
              email: "test@example.com",
            },
          },
        ],
      }

      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.organization.create).mockResolvedValue(mockOrganization as any)

      const result = await service.create({
        name: "Test Org",
        slug: "test-org",
        description: "Test Description",
        createdBy: "user-1",
      })

      expect(result).toEqual(mockOrganization)
      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: "Test Org",
          slug: "test-org",
          description: "Test Description",
          createdBy: "user-1",
          members: {
            create: {
              userId: "user-1",
              role: MemberRole.OWNER,
            },
          },
        },
        include: expect.any(Object),
      })
    })

    it("should throw error if slug already exists", async () => {
      const { prisma } = await import("@/lib/prisma")
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({
        id: "existing-org",
        slug: "test-org",
      } as any)

      await expect(
        service.create({
          name: "Test Org",
          slug: "test-org",
          createdBy: "user-1",
        })
      ).rejects.toThrow("このスラッグは既に使用されています")
    })
  })

  describe("canPerformAction", () => {
    it("should return true for OWNER performing ADMIN action", async () => {
      const { prisma } = await import("@/lib/prisma")
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        id: "member-1",
        role: MemberRole.OWNER,
        userId: "user-1",
        organizationId: "org-1",
      } as any)

      const result = await service.canPerformAction("org-1", "user-1", MemberRole.ADMIN)
      expect(result).toBe(true)
    })

    it("should return false for MEMBER performing ADMIN action", async () => {
      const { prisma } = await import("@/lib/prisma")
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        id: "member-1",
        role: MemberRole.MEMBER,
        userId: "user-1",
        organizationId: "org-1",
      } as any)

      const result = await service.canPerformAction("org-1", "user-1", MemberRole.ADMIN)
      expect(result).toBe(false)
    })

    it("should return false if user is not a member", async () => {
      const { prisma } = await import("@/lib/prisma")
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue(null)

      const result = await service.canPerformAction("org-1", "user-1", MemberRole.MEMBER)
      expect(result).toBe(false)
    })
  })

  describe("removeMember", () => {
    it("should prevent removing the last owner", async () => {
      const { prisma } = await import("@/lib/prisma")
      vi.mocked(prisma.organizationMember.count).mockResolvedValue(1)
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        id: "member-1",
        role: MemberRole.OWNER,
        userId: "user-1",
        organizationId: "org-1",
      } as any)

      await expect(
        service.removeMember("org-1", "user-1")
      ).rejects.toThrow("最後のオーナーは削除できません")
    })

    it("should allow removing non-owner members", async () => {
      const { prisma } = await import("@/lib/prisma")
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        id: "member-1",
        role: MemberRole.MEMBER,
        userId: "user-2",
        organizationId: "org-1",
      } as any)
      vi.mocked(prisma.organizationMember.delete).mockResolvedValue({} as any)

      await service.removeMember("org-1", "user-2")

      expect(prisma.organizationMember.delete).toHaveBeenCalledWith({
        where: {
          organizationId_userId: {
            organizationId: "org-1",
            userId: "user-2",
          },
        },
      })
    })
  })
})
