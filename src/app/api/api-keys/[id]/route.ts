import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response"
import { apiKeyService } from "@/services/api-key.service"

// DELETE /api/api-keys/:id - Revoke API key
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    // Get API key to check ownership
    const apiKey = await apiKeyService.getById(params.id)

    if (apiKey.userId !== session.user.id) {
      return errorResponse("このAPIキーを削除する権限がありません", 403, "FORBIDDEN")
    }

    await apiKeyService.revoke(params.id, session.user.id)

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
