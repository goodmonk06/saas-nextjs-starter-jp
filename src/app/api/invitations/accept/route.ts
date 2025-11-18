import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response"
import { invitationService } from "@/services/invitation.service"
import { z } from "zod"

const acceptInvitationSchema = z.object({
  token: z.string().min(1),
})

// POST /api/invitations/accept - Accept an invitation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    const body = await req.json()
    const { token } = acceptInvitationSchema.parse(body)

    const organization = await invitationService.accept(token, session.user.id)

    return successResponse({
      success: true,
      organization,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
