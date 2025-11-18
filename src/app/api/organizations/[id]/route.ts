import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response"
import { updateOrganizationSchema } from "@/lib/validations/organization"
import { organizationService } from "@/services/organization.service"
import { eventBus, createEvent } from "@/lib/events/bus"
import { OrganizationUpdatedEvent, OrganizationDeletedEvent } from "@/lib/events/types"

// GET /api/organizations/:id - Get organization by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    const organization = await organizationService.getById(params.id, session.user.id)

    if (!organization) {
      return errorResponse("組織が見つかりません", 404, "NOT_FOUND")
    }

    return successResponse(organization)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/organizations/:id - Update organization
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    // Check if user has ADMIN or OWNER role
    const canUpdate = await organizationService.canPerformAction(
      params.id,
      session.user.id,
      "ADMIN"
    )

    if (!canUpdate) {
      return errorResponse("組織を更新する権限がありません", 403, "FORBIDDEN")
    }

    const body = await req.json()
    const validatedData = updateOrganizationSchema.parse(body)

    const updated = await organizationService.update(params.id, validatedData)

    // Emit event
    await eventBus.emit(
      createEvent<OrganizationUpdatedEvent>({
        type: "organization.updated",
        organizationId: params.id,
        userId: session.user.id,
        data: validatedData,
      })
    )

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/organizations/:id - Soft delete organization
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    // Only OWNER can delete organization
    const role = await organizationService.getUserRole(params.id, session.user.id)

    if (role !== "OWNER") {
      return errorResponse("組織を削除する権限がありません", 403, "FORBIDDEN")
    }

    await organizationService.delete(params.id)

    // Emit event
    await eventBus.emit(
      createEvent<OrganizationDeletedEvent>({
        type: "organization.deleted",
        organizationId: params.id,
        userId: session.user.id,
      })
    )

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
