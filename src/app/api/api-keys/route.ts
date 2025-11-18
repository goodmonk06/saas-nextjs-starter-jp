import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response"
import { createApiKeySchema } from "@/lib/validations/api-key"
import { apiKeyService } from "@/services/api-key.service"

// GET /api/api-keys - List user's API keys
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    const apiKeys = await apiKeyService.listForUser(session.user.id)

    return successResponse(apiKeys)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/api-keys - Create new API key
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    const body = await req.json()
    const validatedData = createApiKeySchema.parse(body)

    const apiKey = await apiKeyService.create({
      ...validatedData,
      userId: session.user.id,
    })

    return successResponse(apiKey, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
