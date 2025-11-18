import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response"
import { updateMemberRoleSchema } from "@/lib/validations/organization"
import { organizationService } from "@/services/organization.service"
import { eventBus, createEvent } from "@/lib/events/bus"
import { MemberRoleUpdatedEvent, MemberRemovedEvent } from "@/lib/events/types"

// PATCH /api/organizations/:id/members/:userId - Update member role
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    // Only ADMIN or OWNER can update roles
    const canUpdate = await organizationService.canPerformAction(
      params.id,
      session.user.id,
      "ADMIN"
    )

    if (!canUpdate) {
      return errorResponse("ロールを更新する権限がありません", 403, "FORBIDDEN")
    }

    const body = await req.json()
    const { role } = updateMemberRoleSchema.parse(body)

    const member = await organizationService.updateMemberRole(params.id, params.userId, role)

    // Emit event
    await eventBus.emit(
      createEvent<MemberRoleUpdatedEvent>({
        type: "member.role_updated",
        organizationId: params.id,
        userId: params.userId,
        newRole: role,
        updatedBy: session.user.id,
      })
    )

    return successResponse(member)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/organizations/:id/members/:userId - Remove member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    // Only ADMIN or OWNER can remove members
    const canRemove = await organizationService.canPerformAction(
      params.id,
      session.user.id,
      "ADMIN"
    )

    if (!canRemove) {
      return errorResponse("メンバーを削除する権限がありません", 403, "FORBIDDEN")
    }

    await organizationService.removeMember(params.id, params.userId)

    // Emit event
    await eventBus.emit(
      createEvent<MemberRemovedEvent>({
        type: "member.removed",
        organizationId: params.id,
        userId: params.userId,
        removedBy: session.user.id,
      })
    )

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
