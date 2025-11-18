/**
 * Invitation Service
 *
 * Business logic for organization invitations
 */

import { prisma } from "@/lib/prisma"
import { MemberRole, InvitationStatus } from "@prisma/client"
import { eventBus, createEvent } from "@/lib/events/bus"
import { logger } from "@/lib/logger"
import { metrics, MetricNames } from "@/lib/metrics"
import crypto from "crypto"

export class InvitationService {
  /**
   * Create an invitation
   */
  async create(data: {
    email: string
    organizationId: string
    role: MemberRole
    invitedBy: string
    expiresInDays?: number
  }) {
    const log = logger.child({ service: "InvitationService", method: "create" })

    try {
      // Check if user is already a member
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existingUser) {
        const existingMember = await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: data.organizationId,
              userId: existingUser.id,
            },
          },
        })

        if (existingMember) {
          throw new Error("このユーザーは既にメンバーです")
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          email: data.email,
          organizationId: data.organizationId,
          status: InvitationStatus.PENDING,
        },
      })

      if (existingInvitation) {
        throw new Error("このメールアドレスへの招待は既に送信されています")
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString("hex")

      // Calculate expiration
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7))

      const invitation = await prisma.invitation.create({
        data: {
          email: data.email,
          organizationId: data.organizationId,
          role: data.role,
          token,
          invitedBy: data.invitedBy,
          inviteeId: existingUser?.id,
          expiresAt,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          inviter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Emit event
      await eventBus.emit(
        createEvent({
          type: "invitation.sent",
          invitationId: invitation.id,
          email: data.email,
          organizationId: data.organizationId,
          role: data.role,
          invitedBy: data.invitedBy,
        })
      )

      // Record metrics
      metrics.recordCounter(MetricNames.INVITATION_SENT, 1, {
        organizationId: data.organizationId,
      })

      log.info("Invitation created", {
        invitationId: invitation.id,
        email: data.email,
        organizationId: data.organizationId,
      })

      return invitation
    } catch (error) {
      log.error("Failed to create invitation", error)
      throw error
    }
  }

  /**
   * Accept an invitation
   */
  async accept(token: string, userId: string) {
    const log = logger.child({ service: "InvitationService", method: "accept" })

    try {
      // Find invitation
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
          organization: true,
        },
      })

      if (!invitation) {
        throw new Error("招待が見つかりません")
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new Error("この招待は既に処理されています")
      }

      if (invitation.expiresAt < new Date()) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED },
        })
        throw new Error("この招待は期限切れです")
      }

      // Check if user's email matches
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user || user.email !== invitation.email) {
        throw new Error("この招待はあなた宛ではありません")
      }

      // Add user as member and mark invitation as accepted
      await prisma.$transaction([
        prisma.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            userId,
            role: invitation.role,
          },
        }),
        prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: InvitationStatus.ACCEPTED,
            acceptedAt: new Date(),
            inviteeId: userId,
          },
        }),
      ])

      // Emit event
      await eventBus.emit(
        createEvent({
          type: "invitation.accepted",
          invitationId: invitation.id,
          organizationId: invitation.organizationId,
          userId,
        })
      )

      log.info("Invitation accepted", {
        invitationId: invitation.id,
        userId,
        organizationId: invitation.organizationId,
      })

      return invitation.organization
    } catch (error) {
      log.error("Failed to accept invitation", error)
      throw error
    }
  }

  /**
   * Revoke an invitation
   */
  async revoke(id: string, revokedBy: string) {
    const log = logger.child({ service: "InvitationService", method: "revoke" })

    try {
      const invitation = await prisma.invitation.update({
        where: { id },
        data: {
          status: InvitationStatus.REVOKED,
        },
      })

      // Emit event
      await eventBus.emit(
        createEvent({
          type: "invitation.revoked",
          invitationId: id,
          organizationId: invitation.organizationId,
          revokedBy,
        })
      )

      log.info("Invitation revoked", { invitationId: id })

      return invitation
    } catch (error) {
      log.error("Failed to revoke invitation", error)
      throw error
    }
  }

  /**
   * Get invitation by token
   */
  async getByToken(token: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!invitation) {
      throw new Error("招待が見つかりません")
    }

    return invitation
  }

  /**
   * List invitations for an organization
   */
  async listForOrganization(organizationId: string, status?: InvitationStatus) {
    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId,
        ...(status && { status }),
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invitee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return invitations
  }

  /**
   * List invitations for a user (by email)
   */
  async listForUser(email: string) {
    const invitations = await prisma.invitation.findMany({
      where: {
        email,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return invitations
  }
}

export const invitationService = new InvitationService()
