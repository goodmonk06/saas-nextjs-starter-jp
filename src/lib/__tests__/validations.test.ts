import { describe, it, expect } from "vitest"
import { updateUserSchema } from "../validations/user"

describe("User Validation", () => {
  describe("updateUserSchema", () => {
    it("should validate correct user data", () => {
      const validData = {
        name: "Test User",
        email: "test@example.com",
      }

      const result = updateUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should accept partial updates", () => {
      const partialData = { name: "Test User" }
      const result = updateUserSchema.safeParse(partialData)
      expect(result.success).toBe(true)
    })

    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
      }

      const result = updateUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject name that is too long", () => {
      const invalidData = {
        name: "a".repeat(101),
      }

      const result = updateUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("should accept empty object", () => {
      const emptyData = {}
      const result = updateUserSchema.safeParse(emptyData)
      expect(result.success).toBe(true)
    })
  })
})
