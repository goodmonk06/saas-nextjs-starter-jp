import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response"
import { updateUserSchema } from "@/lib/validations/user"

// GET /api/users/me - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return errorResponse("ユーザーが見つかりません", 404, "USER_NOT_FOUND")
    }

    return successResponse(user)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/users/me - Update current user profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    const body = await req.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if email is being changed and if it's already taken
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id: session.user.id },
        },
      })

      if (existingUser) {
        return errorResponse(
          "このメールアドレスは既に使用されています",
          400,
          "EMAIL_ALREADY_EXISTS"
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return successResponse(updatedUser)
  } catch (error) {
    return handleApiError(error)
  }
}
