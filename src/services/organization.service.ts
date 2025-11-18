/**
 * Organization Service
 *
 * Business logic for organization management
 */

import { prisma } from "@/lib/prisma"
import { MemberRole } from "@prisma/client"
import { eventBus, createEvent } from "@/lib/events/bus"
import { logger } from "@/lib/logger"
import { metrics, MetricNames } from "@/lib/metrics"

export class OrganizationService {
  /**
   * Create a new organization
   */
  async create(data: {
    name: string
    slug: string
    description?: string
    createdBy: string
  }) {
    const log = logger.child({ service: "OrganizationService", method: "create" })

    try {
      // Check slug uniqueness
      const existing = await prisma.organization.findUnique({
        where: { slug: data.slug },
      })

      if (existing) {
        throw new Error("このスラッグは既に使用されています")
      }

      // Create organization and add creator as OWNER
      const organization = await prisma.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          createdBy: data.createdBy,
          members: {
            create: {
              userId: data.createdBy,
              role: MemberRole.OWNER,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      // Emit event
      await eventBus.emit(
        createEvent({
          type: "organization.created",
          organizationId: organization.id,
          name: organization.name,
          slug: organization.slug,
          createdBy: data.createdBy,
        })
      )

      // Record metrics
      metrics.recordCounter(MetricNames.ORGANIZATION_CREATED, 1, {
        userId: data.createdBy,
      })

      log.info("Organization created", {
        organizationId: organization.id,
        slug: organization.slug,
      })

      return organization
    } catch (error) {
      log.error("Failed to create organization", error)
      throw error
    }
  }

  /**
   * Get organizations for a user
   */
  async listForUser(userId: string) {
    const organizations = await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
        deletedAt: null,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            invitations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return organizations
  }

  /**
   * Get organization by ID
   */
  async getById(id: string, userId: string) {
    const organization = await prisma.organization.findFirst({
      where: {
        id,
        deletedAt: null,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        invitations: {
          where: {
            status: "PENDING",
          },
        },
        _count: {
          select: {
            auditLogs: true,
            apiKeys: true,
          },
        },
      },
    })

    if (!organization) {
      throw new Error("組織が見つからないか、アクセス権限がありません")
    }

    return organization
  }

  /**
   * Check if user has a specific role in organization
   */
  async getUserRole(organizationId: string, userId: string): Promise<MemberRole | null> {
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    })

    return member?.role || null
  }

  /**
   * Check if user can perform action
   */
  async canPerformAction(
    organizationId: string,
    userId: string,
    requiredRole: MemberRole
  ): Promise<boolean> {
    const role = await this.getUserRole(organizationId, userId)
    if (!role) return false

    // Role hierarchy: OWNER > ADMIN > MEMBER
    const hierarchy = {
      [MemberRole.OWNER]: 3,
      [MemberRole.ADMIN]: 2,
      [MemberRole.MEMBER]: 1,
    }

    return hierarchy[role] >= hierarchy[requiredRole]
  }

  /**
   * Update organization
   */
  async update(id: string, data: {
    name?: string
    slug?: string
    description?: string
    logo?: string
    settings?: any
  }) {
    const log = logger.child({ service: "OrganizationService", method: "update" })

    try {
      // If slug is changing, check uniqueness
      if (data.slug) {
        const existing = await prisma.organization.findFirst({
          where: {
            slug: data.slug,
            id: { not: id },
          },
        })

        if (existing) {
          throw new Error("このスラッグは既に使用されています")
        }
      }

      const organization = await prisma.organization.update({
        where: { id },
        data,
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      })

      log.info("Organization updated", {
        organizationId: id,
        changes: Object.keys(data),
      })

      return organization
    } catch (error) {
      log.error("Failed to update organization", error)
      throw error
    }
  }

  /**
   * Soft delete organization
   */
  async delete(id: string) {
    const log = logger.child({ service: "OrganizationService", method: "delete" })

    try {
      await prisma.organization.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      })

      log.info("Organization deleted", { organizationId: id })
    } catch (error) {
      log.error("Failed to delete organization", error)
      throw error
    }
  }

  /**
   * Add member to organization
   */
  async addMember(organizationId: string, userId: string, role: MemberRole = MemberRole.MEMBER) {
    const log = logger.child({ service: "OrganizationService", method: "addMember" })

    try {
      const member = await prisma.organizationMember.create({
        data: {
          organizationId,
          userId,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })

      log.info("Member added to organization", {
        organizationId,
        userId,
        role,
      })

      return member
    } catch (error) {
      log.error("Failed to add member", error)
      throw error
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, userId: string) {
    const log = logger.child({ service: "OrganizationService", method: "removeMember" })

    try {
      // Prevent removing the last owner
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId,
          role: MemberRole.OWNER,
        },
      })

      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
      })

      if (member?.role === MemberRole.OWNER && ownerCount === 1) {
        throw new Error("最後のオーナーは削除できません")
      }

      await prisma.organizationMember.delete({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
      })

      log.info("Member removed from organization", {
        organizationId,
        userId,
      })
    } catch (error) {
      log.error("Failed to remove member", error)
      throw error
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(organizationId: string, userId: string, role: MemberRole) {
    const log = logger.child({ service: "OrganizationService", method: "updateMemberRole" })

    try {
      const member = await prisma.organizationMember.update({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })

      log.info("Member role updated", {
        organizationId,
        userId,
        newRole: role,
      })

      return member
    } catch (error) {
      log.error("Failed to update member role", error)
      throw error
    }
  }
}

export const organizationService = new OrganizationService()
