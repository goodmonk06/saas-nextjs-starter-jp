import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response"
import { createOrganizationSchema } from "@/lib/validations/organization"
import { organizationService } from "@/services/organization.service"

// GET /api/organizations - List user's organizations
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    const organizations = await organizationService.listForUser(session.user.id)

    return successResponse(organizations)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/organizations - Create new organization
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return errorResponse("認証が必要です", 401, "UNAUTHORIZED")
    }

    const body = await req.json()
    const validatedData = createOrganizationSchema.parse(body)

    const organization = await organizationService.create({
      ...validatedData,
      createdBy: session.user.id,
    })

    return successResponse(organization, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
