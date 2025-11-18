import { z } from "zod"

export const createApiKeySchema = z.object({
  name: z.string().min(1, "名前は必須です").max(100),
  scopes: z.array(z.string()).optional(),
  expiresInDays: z.number().positive().optional(),
})

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
