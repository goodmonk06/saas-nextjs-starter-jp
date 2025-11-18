import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response"
import { organizationService } from "@/services/organization.service"
import { eventBus, createEvent } from "@/lib/events/bus"
import { MemberAddedEvent } from "@/lib/events/types"
import { MemberRole } from "@prisma/client"

// GET /api/organizations/:id/members - List organization members
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    // User must be a member to view members
    const role = await organizationService.getUserRole(params.id, session.user.id)

    if (!role) {
      return errorResponse("この組織のメンバーではありません", 403, "FORBIDDEN")
    }

    const organization = await organizationService.getById(params.id, session.user.id)

    return successResponse(organization.members)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/organizations/:id/members - Add member to organization (invitation only, see invitations API)
// This endpoint is mainly for accepting invitations
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    // Only ADMIN or OWNER can add members directly
    const canAdd = await organizationService.canPerformAction(
      params.id,
      session.user.id,
      "ADMIN"
    )

    if (!canAdd) {
      return errorResponse("メンバーを追加する権限がありません", 403, "FORBIDDEN")
    }

    const body = await req.json()
    const { userId, role = "MEMBER" } = body

    if (!userId) {
      return errorResponse("ユーザーIDが必要です", 400, "VALIDATION_ERROR")
    }

    // Validate role
    if (!Object.values(MemberRole).includes(role)) {
      return errorResponse("無効なロールです", 400, "VALIDATION_ERROR")
    }

    const member = await organizationService.addMember(params.id, userId, role)

    // Emit event
    await eventBus.emit(
      createEvent<MemberAddedEvent>({
        type: "member.added",
        organizationId: params.id,
        userId,
        role,
        addedBy: session.user.id,
      })
    )

    return successResponse(member, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
