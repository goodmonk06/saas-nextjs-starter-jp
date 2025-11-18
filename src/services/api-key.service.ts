/**
 * API Key Service
 *
 * Business logic for API key management
 */

import { prisma } from "@/lib/prisma"
import { eventBus, createEvent } from "@/lib/events/bus"
import { logger } from "@/lib/logger"
import { metrics, MetricNames } from "@/lib/metrics"
import crypto from "crypto"

export class ApiKeyService {
  /**
   * Generate a secure API key
   */
  private generateKey(): { key: string; prefix: string; hash: string } {
    // Generate random bytes
    const randomBytes = crypto.randomBytes(32)
    const key = `sk_${randomBytes.toString("base64url")}`

    // Create prefix for display (first 8 chars)
    const prefix = key.substring(0, 12)

    // Hash the key for storage
    const hash = crypto.createHash("sha256").update(key).digest("hex")

    return { key, prefix, hash }
  }

  /**
   * Create an API key
   */
  async create(data: {
    name: string
    userId?: string
    organizationId?: string
    scopes?: string[]
    expiresInDays?: number
  }) {
    const log = logger.child({ service: "ApiKeyService", method: "create" })

    try {
      if (!data.userId && !data.organizationId) {
        throw new Error("ユーザーIDまたは組織IDが必要です")
      }

      const { key, prefix, hash } = this.generateKey()

      // Calculate expiration if provided
      let expiresAt: Date | null = null
      if (data.expiresInDays) {
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + data.expiresInDays)
      }

      const apiKey = await prisma.apiKey.create({
        data: {
          name: data.name,
          key: hash, // Store hash, not plain key
          prefix,
          userId: data.userId,
          organizationId: data.organizationId,
          scopes: data.scopes || [],
          expiresAt,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })

      // Emit event
      await eventBus.emit(
        createEvent({
          type: "api_key.created",
          apiKeyId: apiKey.id,
          userId: data.userId,
          organizationId: data.organizationId,
        })
      )

      // Record metrics
      metrics.recordCounter(MetricNames.API_KEY_CREATED, 1, {
        userId: data.userId,
        organizationId: data.organizationId,
      })

      log.info("API key created", {
        apiKeyId: apiKey.id,
        name: data.name,
      })

      // Return the API key with the plain key (only time it's shown)
      return {
        ...apiKey,
        key, // Plain key - only shown once
      }
    } catch (error) {
      log.error("Failed to create API key", error)
      throw error
    }
  }

  /**
   * List API keys for a user
   */
  async listForUser(userId: string) {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return apiKeys
  }

  /**
   * List API keys for an organization
   */
  async listForOrganization(organizationId: string) {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        organizationId,
        revokedAt: null,
      },
      include: {
        user: {
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

    return apiKeys
  }

  /**
   * Revoke an API key
   */
  async revoke(id: string, revokedBy: string) {
    const log = logger.child({ service: "ApiKeyService", method: "revoke" })

    try {
      const apiKey = await prisma.apiKey.update({
        where: { id },
        data: {
          revokedAt: new Date(),
        },
      })

      // Emit event
      await eventBus.emit(
        createEvent({
          type: "api_key.revoked",
          apiKeyId: id,
          userId: revokedBy,
        })
      )

      log.info("API key revoked", { apiKeyId: id })

      return apiKey
    } catch (error) {
      log.error("Failed to revoke API key", error)
      throw error
    }
  }

  /**
   * Validate an API key
   */
  async validate(key: string): Promise<{
    valid: boolean
    apiKey?: any
    reason?: string
  }> {
    const log = logger.child({ service: "ApiKeyService", method: "validate" })

    try {
      // Hash the provided key
      const hash = crypto.createHash("sha256").update(key).digest("hex")

      // Find the API key
      const apiKey = await prisma.apiKey.findUnique({
        where: { key: hash },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              plan: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
            },
          },
        },
      })

      if (!apiKey) {
        return { valid: false, reason: "Invalid API key" }
      }

      if (apiKey.revokedAt) {
        return { valid: false, reason: "API key has been revoked" }
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { valid: false, reason: "API key has expired" }
      }

      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })

      log.debug("API key validated", {
        apiKeyId: apiKey.id,
        userId: apiKey.userId,
        organizationId: apiKey.organizationId,
      })

      return { valid: true, apiKey }
    } catch (error) {
      log.error("Failed to validate API key", error)
      return { valid: false, reason: "Validation error" }
    }
  }

  /**
   * Get API key by ID
   */
  async getById(id: string) {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!apiKey) {
      throw new Error("APIキーが見つかりません")
    }

    return apiKey
  }
}

export const apiKeyService = new ApiKeyService()
