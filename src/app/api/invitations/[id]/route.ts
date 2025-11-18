import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response"
import { invitationService } from "@/services/invitation.service"
import { organizationService } from "@/services/organization.service"

// DELETE /api/invitations/:id - Revoke invitation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    // Get invitation to check organization
    const invitation = await invitationService.getByToken(params.id).catch(() => null)

    if (!invitation) {
      return errorResponse("招待が見つかりません", 404, "NOT_FOUND")
    }

    // Only ADMIN or OWNER of the organization can revoke
    const canRevoke = await organizationService.canPerformAction(
      invitation.organizationId,
      session.user.id,
      "ADMIN"
    )

    if (!canRevoke) {
      return errorResponse("招待を取り消す権限がありません", 403, "FORBIDDEN")
    }

    await invitationService.revoke(params.id, session.user.id)

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
