import { NextResponse } from "next/server"
import { ZodError } from "zod"

export type ApiResponse<T = any> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: {
        message: string
        code?: string
        details?: any
      }
    }

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    } as ApiResponse<T>,
    { status }
  )
}

export function errorResponse(
  message: string,
  status = 400,
  code?: string,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    } as ApiResponse,
    { status }
  )
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error)

  if (error instanceof ZodError) {
    return errorResponse(
      "バリデーションエラー",
      400,
      "VALIDATION_ERROR",
      error.errors
    )
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500, "INTERNAL_ERROR")
  }

  return errorResponse("予期しないエラーが発生しました", 500, "UNKNOWN_ERROR")
}
