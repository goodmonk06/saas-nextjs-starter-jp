import { z } from "zod"

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "組織名は必須です").max(100, "組織名は100文字以内で入力してください"),
  slug: z
    .string()
    .min(2, "スラッグは2文字以上である必要があります")
    .max(50, "スラッグは50文字以内で入力してください")
    .regex(/^[a-z0-9-]+$/, "スラッグは小文字の英数字とハイフンのみ使用できます"),
  description: z.string().max(500, "説明は500文字以内で入力してください").optional(),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  logo: z.string().url("有効なURLを入力してください").optional(),
  settings: z.record(z.any()).optional(),
})

export const inviteMemberSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
