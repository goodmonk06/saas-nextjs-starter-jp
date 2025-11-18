import { describe, it, expect, beforeEach, vi } from "vitest"
import { InvitationService } from "../invitation.service"
import { InvitationStatus } from "@prisma/client"

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    invitation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    organizationMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((operations) => Promise.all(operations)),
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
    INVITATION_SENT: "invitation.sent",
  },
}))

describe("InvitationService", () => {
  let service: InvitationService

  beforeEach(() => {
    service = new InvitationService()
    vi.clearAllMocks()
  })

  describe("create", () => {
    it("should create invitation with token", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockInvitation = {
        id: "inv-1",
        email: "invite@example.com",
        organizationId: "org-1",
        role: "MEMBER",
        token: "test-token",
        invitedBy: "user-1",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        organization: {
          id: "org-1",
          name: "Test Org",
          slug: "test-org",
        },
        inviter: {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
        },
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.invitation.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.invitation.create).mockResolvedValue(mockInvitation as any)

      const result = await service.create({
        email: "invite@example.com",
        organizationId: "org-1",
        role: "MEMBER" as any,
        invitedBy: "user-1",
      })

      expect(result).toEqual(mockInvitation)
      expect(prisma.invitation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "invite@example.com",
          organizationId: "org-1",
          role: "MEMBER",
          invitedBy: "user-1",
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
        include: expect.any(Object),
      })
    })

    it("should throw error if user is already a member", async () => {
      const { prisma } = await import("@/lib/prisma")
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-2",
        email: "invite@example.com",
      } as any)
      vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({
        id: "member-1",
        userId: "user-2",
        organizationId: "org-1",
      } as any)

      await expect(
        service.create({
          email: "invite@example.com",
          organizationId: "org-1",
          role: "MEMBER" as any,
          invitedBy: "user-1",
        })
      ).rejects.toThrow("このユーザーは既にメンバーです")
    })

    it("should throw error if pending invitation exists", async () => {
      const { prisma } = await import("@/lib/prisma")
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.invitation.findFirst).mockResolvedValue({
        id: "inv-1",
        status: InvitationStatus.PENDING,
      } as any)

      await expect(
        service.create({
          email: "invite@example.com",
          organizationId: "org-1",
          role: "MEMBER" as any,
          invitedBy: "user-1",
        })
      ).rejects.toThrow("このメールアドレスへの招待は既に送信されています")
    })
  })

  describe("accept", () => {
    it("should accept valid invitation", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockInvitation = {
        id: "inv-1",
        email: "invite@example.com",
        organizationId: "org-1",
        role: "MEMBER",
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        organization: {
          id: "org-1",
          name: "Test Org",
        },
      }

      const mockUser = {
        id: "user-2",
        email: "invite@example.com",
      }

      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.$transaction).mockImplementation((operations: any) => {
        return Promise.all(operations)
      })

      const result = await service.accept("test-token", "user-2")

      expect(result).toEqual(mockInvitation.organization)
    })

    it("should throw error for expired invitation", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockInvitation = {
        id: "inv-1",
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() - 1000), // Expired
      }

      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any)
      vi.mocked(prisma.invitation.update).mockResolvedValue(mockInvitation as any)

      await expect(
        service.accept("test-token", "user-2")
      ).rejects.toThrow("この招待は期限切れです")

      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: { status: InvitationStatus.EXPIRED },
      })
    })

    it("should throw error for already processed invitation", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockInvitation = {
        id: "inv-1",
        status: InvitationStatus.ACCEPTED,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any)

      await expect(
        service.accept("test-token", "user-2")
      ).rejects.toThrow("この招待は既に処理されています")
    })

    it("should throw error if email doesn't match", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockInvitation = {
        id: "inv-1",
        email: "invite@example.com",
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      const mockUser = {
        id: "user-2",
        email: "other@example.com", // Different email
      }

      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      await expect(
        service.accept("test-token", "user-2")
      ).rejects.toThrow("この招待はあなた宛ではありません")
    })
  })

  describe("revoke", () => {
    it("should revoke invitation", async () => {
      const { prisma } = await import("@/lib/prisma")
      const mockInvitation = {
        id: "inv-1",
        status: InvitationStatus.REVOKED,
        organizationId: "org-1",
      }

      vi.mocked(prisma.invitation.update).mockResolvedValue(mockInvitation as any)

      await service.revoke("inv-1", "user-1")

      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: { status: InvitationStatus.REVOKED },
      })
    })
  })
})
