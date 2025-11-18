import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response"
import { invitationService } from "@/services/invitation.service"

// GET /api/invitations/me - Get current user's pending invitations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.email) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    const invitations = await invitationService.listForUser(session.user.email)

    return successResponse(invitations)
  } catch (error) {
    return handleApiError(error)
  }
}
