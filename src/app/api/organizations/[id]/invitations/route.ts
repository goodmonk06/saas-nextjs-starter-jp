import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response"
import { inviteMemberSchema } from "@/lib/validations/organization"
import { organizationService } from "@/services/organization.service"
import { invitationService } from "@/services/invitation.service"

// GET /api/organizations/:id/invitations - List organization invitations
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    // Only ADMIN or OWNER can view invitations
    const canView = await organizationService.canPerformAction(
      params.id,
      session.user.id,
      "ADMIN"
    )

    if (!canView) {
      return errorResponse("招待を表示する権限がありません", 403, "FORBIDDEN")
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") as any

    const invitations = await invitationService.listForOrganization(params.id, status)

    return successResponse(invitations)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/organizations/:id/invitations - Send invitation
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    // Only ADMIN or OWNER can invite
    const canInvite = await organizationService.canPerformAction(
      params.id,
      session.user.id,
      "ADMIN"
    )

    if (!canInvite) {
      return errorResponse("招待を送信する権限がありません", 403, "FORBIDDEN")
    }

    const body = await req.json()
    const validatedData = inviteMemberSchema.parse(body)

    const invitation = await invitationService.create({
      email: validatedData.email,
      organizationId: params.id,
      role: validatedData.role,
      invitedBy: session.user.id,
    })

    return successResponse(invitation, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
