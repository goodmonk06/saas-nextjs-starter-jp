import { z } from "zod"

// User schemas
export const updateUserSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(100, "名前は100文字以内で入力してください").optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional(),
})

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  plan: z.enum(["FREE", "PRO"]),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserResponse = z.infer<typeof userResponseSchema>
