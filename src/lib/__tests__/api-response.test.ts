import { describe, it, expect } from "vitest"
import { successResponse, errorResponse } from "../api-response"

describe("API Response Utilities", () => {
  describe("successResponse", () => {
    it("should create a successful response with data", async () => {
      const data = { id: "123", name: "Test" }
      const response = successResponse(data)
      const json = await response.json()

      expect(json).toEqual({
        success: true,
        data,
      })
      expect(response.status).toBe(200)
    })

    it("should accept custom status code", async () => {
      const response = successResponse({ created: true }, 201)
      expect(response.status).toBe(201)
    })
  })

  describe("errorResponse", () => {
    it("should create an error response", async () => {
      const response = errorResponse("Something went wrong", 400)
      const json = await response.json()

      expect(json).toEqual({
        success: false,
        error: {
          message: "Something went wrong",
          code: undefined,
          details: undefined,
        },
      })
      expect(response.status).toBe(400)
    })

    it("should include error code and details when provided", async () => {
      const response = errorResponse(
        "Validation failed",
        400,
        "VALIDATION_ERROR",
        { field: "email" }
      )
      const json = await response.json()

      expect(json.error.code).toBe("VALIDATION_ERROR")
      expect(json.error.details).toEqual({ field: "email" })
    })
  })
})
